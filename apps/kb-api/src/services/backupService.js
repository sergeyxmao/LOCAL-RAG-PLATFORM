import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { createGzip, createGunzip } from "node:zlib";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";

const BACKUP_FILE_PATTERN = /^backup_[0-9]{8}_[0-9]{6}\.sql(\.gz)?$/;

function buildTimestamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return (
    String(d.getFullYear()) +
    pad(d.getMonth() + 1) +
    pad(d.getDate()) +
    "_" +
    pad(d.getHours()) +
    pad(d.getMinutes()) +
    pad(d.getSeconds())
  );
}

function isSafeBackupName(name) {
  if (typeof name !== "string") return false;
  if (name.indexOf("/") >= 0 || name.indexOf("\\") >= 0 || name.indexOf("..") >= 0) return false;
  return BACKUP_FILE_PATTERN.test(name);
}

export class BackupService {
  constructor({ postgresConfig, backupRoot, logger }) {
    this.postgresConfig = postgresConfig;
    this.backupRoot = backupRoot;
    this.logger = logger || { info: () => {}, warn: () => {}, error: () => {} };
  }

  async ensureBackupRoot() {
    await fsp.mkdir(this.backupRoot, { recursive: true });
  }

  buildEnv() {
    return {
      ...process.env,
      PGPASSWORD: this.postgresConfig.password,
    };
  }

  async listBackups({ limit = 50 } = {}) {
    await this.ensureBackupRoot();
    const entries = await fsp.readdir(this.backupRoot);
    const items = [];
    for (const name of entries) {
      if (!isSafeBackupName(name)) continue;
      const fullPath = path.join(this.backupRoot, name);
      try {
        const stat = await fsp.stat(fullPath);
        if (!stat.isFile()) continue;
        items.push({
          filename: name,
          size: stat.size,
          createdAt: stat.mtime.toISOString(),
        });
      } catch (err) {}
    }
    items.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    return items.slice(0, Math.max(1, Math.min(200, Number(limit) || 50)));
  }

  async createBackup() {
    await this.ensureBackupRoot();
    const filename = `backup_${buildTimestamp()}.sql.gz`;
    const fullPath = path.join(this.backupRoot, filename);
    const startedAt = Date.now();

    const pgDump = spawn(
      "pg_dump",
      [
        "-h",
        this.postgresConfig.host,
        "-p",
        String(this.postgresConfig.port || 5432),
        "-U",
        this.postgresConfig.user,
        "-d",
        this.postgresConfig.database,
        "--no-owner",
        "--no-privileges",
      ],
      { env: this.buildEnv() }
    );

    const fileStream = fs.createWriteStream(fullPath);
    const gzip = createGzip();

    let stderr = "";
    pgDump.stderr.on("data", (chunk) => { stderr += chunk.toString(); });

    try {
      await Promise.all([
        pipeline(pgDump.stdout, gzip, fileStream),
        new Promise((resolve, reject) => {
          pgDump.on("exit", (code) => {
            if (code === 0) resolve();
            else reject(new Error(`pg_dump exited with code ${code}: ${stderr.slice(0, 500)}`));
          });
          pgDump.on("error", reject);
        }),
      ]);
    } catch (error) {
      try { await fsp.unlink(fullPath); } catch (err) {}
      this.logger.error({ err: error }, "Backup failed");
      throw error;
    }

    const stat = await fsp.stat(fullPath);
    this.logger.info(
      { filename, size: stat.size, durationMs: Date.now() - startedAt },
      "Backup created"
    );
    return {
      filename,
      size: stat.size,
      createdAt: stat.mtime.toISOString(),
      durationMs: Date.now() - startedAt,
    };
  }

  resolveBackupPath(filename) {
    if (!isSafeBackupName(filename)) {
      const err = new Error("Некорректное имя файла бэкапа");
      err.statusCode = 400;
      throw err;
    }
    return path.join(this.backupRoot, filename);
  }

  async getBackupStat(filename) {
    const full = this.resolveBackupPath(filename);
    try {
      const stat = await fsp.stat(full);
      if (!stat.isFile()) throw new Error("not a file");
      return { fullPath: full, size: stat.size, createdAt: stat.mtime.toISOString() };
    } catch (err) {
      const error = new Error("Файл бэкапа не найден");
      error.statusCode = 404;
      throw error;
    }
  }

  async deleteBackup(filename) {
    const { fullPath } = await this.getBackupStat(filename);
    await fsp.unlink(fullPath);
  }

  async terminateOtherConnectionsAndResetSchema() {
    const env = this.buildEnv();
    const args = [
      "-h",
      this.postgresConfig.host,
      "-p",
      String(this.postgresConfig.port || 5432),
      "-U",
      this.postgresConfig.user,
      "-d",
      this.postgresConfig.database,
      "-v",
      "ON_ERROR_STOP=1",
      "--quiet",
      "--no-psqlrc",
      "-c",
      `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${this.postgresConfig.database}' AND pid <> pg_backend_pid();`,
      "-c",
      "DROP SCHEMA IF EXISTS public CASCADE;",
      "-c",
      "CREATE SCHEMA public;",
      "-c",
      `GRANT ALL ON SCHEMA public TO ${this.postgresConfig.user};`,
      "-c",
      "GRANT ALL ON SCHEMA public TO public;",
    ];

    const psql = spawn("psql", args, { env });
    let stderr = "";
    psql.stdout.on("data", () => {});
    psql.stderr.on("data", (chunk) => { stderr += chunk.toString(); });
    await new Promise((resolve, reject) => {
      psql.on("exit", (code) => {
        if (code === 0) resolve();
        else reject(new Error(`psql (reset schema) exited with code ${code}: ${stderr.slice(0, 500)}`));
      });
      psql.on("error", reject);
    });
  }

  async restoreFromStream(sourceStream, { compressed = true } = {}) {
    const startedAt = Date.now();

    await this.terminateOtherConnectionsAndResetSchema();

    const psql = spawn(
      "psql",
      [
        "-h",
        this.postgresConfig.host,
        "-p",
        String(this.postgresConfig.port || 5432),
        "-U",
        this.postgresConfig.user,
        "-d",
        this.postgresConfig.database,
        "-v",
        "ON_ERROR_STOP=1",
        "--quiet",
        "--no-psqlrc",
      ],
      { env: this.buildEnv() }
    );

    let stderr = "";
    psql.stdout.on("data", () => {});
    psql.stderr.on("data", (chunk) => { stderr += chunk.toString(); });

    try {
      const upstream = compressed ? sourceStream.pipe(createGunzip()) : sourceStream;
      await Promise.all([
        pipeline(upstream, psql.stdin),
        new Promise((resolve, reject) => {
          psql.on("exit", (code) => {
            if (code === 0) resolve();
            else reject(new Error(`Не удалось восстановить базу из дампа: psql завершился с кодом ${code}. ${stderr.slice(0, 500).trim()}`));
          });
          psql.on("error", reject);
        }),
      ]);
    } catch (error) {
      this.logger.error({ err: error, stderrTail: stderr.slice(-500) }, "Restore failed");
      throw error;
    }

    this.logger.info({ durationMs: Date.now() - startedAt, stderrTail: stderr.slice(-200) }, "Restore completed");
    return { durationMs: Date.now() - startedAt, restartScheduled: true };
  }

  async restoreFromExistingBackup(filename) {
    const { fullPath } = await this.getBackupStat(filename);
    const stream = fs.createReadStream(fullPath);
    const compressed = fullPath.endsWith(".gz");
    return this.restoreFromStream(stream, { compressed });
  }

  async restoreFromBuffer(buffer, { compressed = true } = {}) {
    const stream = Readable.from(buffer);
    return this.restoreFromStream(stream, { compressed });
  }
}

export { isSafeBackupName, BACKUP_FILE_PATTERN };

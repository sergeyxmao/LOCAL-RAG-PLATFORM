import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";

function readYamlFile(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) {
      return fallback;
    }

    return yaml.load(fs.readFileSync(filePath, "utf8")) ?? fallback;
  } catch (error) {
    return fallback;
  }
}

const configDir = process.env.CONFIG_DIR || "/app/config";

export const workerConfig = {
  models: readYamlFile(path.join(configDir, "models.yaml"), {}),
  ingestion: readYamlFile(path.join(configDir, "ingestion.yaml"), {}),
};

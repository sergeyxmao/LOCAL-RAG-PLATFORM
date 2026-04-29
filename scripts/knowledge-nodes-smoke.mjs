#!/usr/bin/env node

const BASE_URL = process.env.LOCAL_RAG_BASE_URL || "http://localhost:8787";
const RUN_ID = `kn-smoke-${new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14)}`;

const createdNodeIds = [];
const createdDocumentIds = [];
const results = [];

function pass(name, details = "") {
  results.push({ ok: true, name, details });
  console.log(`ok - ${name}${details ? ` (${details})` : ""}`);
}

function fail(name, error) {
  results.push({ ok: false, name, details: error?.message || String(error) });
  console.error(`not ok - ${name}: ${error?.message || error}`);
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function api(method, path, body = undefined, { statuses = [200] } = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: body === undefined ? undefined : { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (error) {
    throw new Error(`${method} ${path}: не JSON ответ ${response.status}: ${text.slice(0, 240)}`);
  }

  if (!statuses.includes(response.status)) {
    throw new Error(
      `${method} ${path}: HTTP ${response.status}, ожидал ${statuses.join("/")} :: ${JSON.stringify(data)}`
    );
  }

  return data;
}

async function step(name, fn) {
  try {
    const details = await fn();
    pass(name, details);
  } catch (error) {
    fail(name, error);
    throw error;
  }
}

async function createNode(name, parentId = null) {
  const data = await api(
    "POST",
    "/nodes",
    {
      name,
      parentId,
      typeLabel: "Smoke",
      color: "#2563EB",
      description: `Временный раздел smoke-теста ${RUN_ID}`,
    },
    { statuses: [201] }
  );
  createdNodeIds.push(data.node.id);
  return data.node;
}

async function createTextDocument(title, text, nodeIds, primaryNodeId = null, categories = []) {
  const data = await api("POST", "/documents/ingest-text", {
    title,
    text,
    sourceLabel: `${RUN_ID}.txt`,
    categories: ["kn-smoke", RUN_ID, ...categories],
    nodeIds,
    primaryNodeId,
  });
  createdDocumentIds.push(data.document.id);
  return data;
}

function ids(items) {
  return new Set((items || []).map((item) => String(item.id || item.document_id || item.documentId)));
}

function untrackCreated(kind, id) {
  const list = kind === "node" ? createdNodeIds : createdDocumentIds;
  const index = list.indexOf(id);
  if (index >= 0) {
    list.splice(index, 1);
  }
}

async function search(query, options = {}) {
  return api("POST", "/search", {
    query,
    limit: 12,
    ...options,
  });
}

async function cleanup() {
  console.log("cleanup - удаляю только временные smoke-документы и smoke-разделы");

  for (const documentId of [...createdDocumentIds].reverse()) {
    try {
      await api("DELETE", `/documents/${encodeURIComponent(documentId)}?removeStoredFile=true`, undefined, {
        statuses: [200, 404],
      });
    } catch (error) {
      console.error(`cleanup warn - document ${documentId}: ${error.message}`);
    }
  }

  const pendingNodeIds = new Set(createdNodeIds);
  for (let passIndex = 1; passIndex <= 6 && pendingNodeIds.size > 0; passIndex += 1) {
    let removedThisPass = 0;
    for (const nodeId of [...pendingNodeIds].reverse()) {
      try {
        const data = await api("DELETE", `/nodes/${encodeURIComponent(nodeId)}?strategy=block`, undefined, {
          statuses: [200, 404, 409],
        });
        if (data?.ok === true || data?.error === "Раздел не найден") {
          pendingNodeIds.delete(nodeId);
          removedThisPass += 1;
        }
      } catch (error) {
        console.error(`cleanup warn - node ${nodeId}: ${error.message}`);
      }
    }
    if (removedThisPass === 0) {
      break;
    }
  }

  if (pendingNodeIds.size > 0) {
    console.error(`cleanup warn - не удалось удалить временные разделы: ${[...pendingNodeIds].join(", ")}`);
  }
}

async function main() {
  console.log(`knowledge_nodes smoke: ${RUN_ID}`);
  console.log(`base url: ${BASE_URL}`);

  const health = await api("GET", "/health");
  assert(health.ok === true, "/health должен вернуть ok=true");

  const qdrant = await api("GET", "/admin/qdrant-status");
  assert(qdrant.qdrant?.ok === true && qdrant.qdrant?.exists === true, "Qdrant collection должна существовать");

  const nodes = await api("GET", "/nodes?format=flat&includeInactive=true");
  const unsorted = nodes.items.find((node) => node.name === "Без раздела" && node.isSystem === true);
  assert(unsorted, "Системный раздел Без раздела должен существовать");

  let root;
  let branchA;
  let branchB;
  let childA;
  let moveParent;
  let deleteTarget;
  let emptyScope;
  let bulkNode;
  let raceNode;
  let triA;
  let triB;
  let triC;
  let mainDoc;
  let deleteDoc;
  let triDoc;
  const bulkDocs = [];

  try {
    await step("1. Миграция/дерево доступны, Без раздела защищён", async () => {
      root = await createNode(`${RUN_ID} root`);
      branchA = await createNode(`${RUN_ID} branch A`, root.id);
      branchB = await createNode(`${RUN_ID} branch B`, root.id);
      childA = await createNode(`${RUN_ID} child A`, branchA.id);
      moveParent = await createNode(`${RUN_ID} move parent`, root.id);
      deleteTarget = await createNode(`${RUN_ID} delete target`, root.id);
      emptyScope = await createNode(`${RUN_ID} empty scope`, root.id);
      bulkNode = await createNode(`${RUN_ID} bulk target`, root.id);
      raceNode = await createNode(`${RUN_ID} race node`, root.id);
      triA = await createNode(`${RUN_ID} tri A`, root.id);
      triB = await createNode(`${RUN_ID} tri B`, root.id);
      triC = await createNode(`${RUN_ID} tri C`, root.id);

      const systemRename = await api(
        "PATCH",
        `/nodes/${encodeURIComponent(unsorted.id)}`,
        { name: `${RUN_ID} bad rename` },
        { statuses: [403] }
      );
      assert(systemRename.ok === false, "Системный раздел не должен переименовываться");
      const systemDelete = await api(
        "DELETE",
        `/nodes/${encodeURIComponent(unsorted.id)}?strategy=block`,
        undefined,
        { statuses: [403] }
      );
      assert(systemDelete.ok === false, "Системный раздел не должен удаляться");
      return `root=${root.id}`;
    });

    await step("2. Документ в 2 разделах отображается в обоих и не дублируется", async () => {
      mainDoc = await createTextDocument(
        `${RUN_ID} RAMPT main`,
        `Уникальный smoke-текст ${RUN_ID}. RAMPT проверяет привязку документа к двум разделам.`,
        [branchA.id, branchB.id],
        branchA.id,
        ["rampt"]
      );
      const links = await api("GET", `/documents/${mainDoc.document.id}/nodes`);
      assert(links.links.length === 2, "Ожидал две прямые привязки документа");
      assert(links.payload.primary_node_id === branchA.id, "primary_node_id должен быть branchA");

      const rootDocs = await api("GET", `/nodes/${root.id}/documents?includeChildren=true&limit=100`);
      const matches = rootDocs.items.filter((item) => item.id === mainDoc.document.id);
      assert(matches.length === 1, "Документ не должен дублироваться в scope родителя");

      const branchADocs = await api("GET", `/nodes/${branchA.id}/documents?includeChildren=false&limit=100`);
      const branchBDocs = await api("GET", `/nodes/${branchB.id}/documents?includeChildren=false&limit=100`);
      assert(ids(branchADocs.items).has(mainDoc.document.id), "Документ должен быть в branchA");
      assert(ids(branchBDocs.items).has(mainDoc.document.id), "Документ должен быть в branchB");
      return "2 links, 1 row in parent scope";
    });

    await step("3. includeChildren=false и includeChildren=true фильтруют scope", async () => {
      const directRoot = await search(RUN_ID, { nodeId: root.id, includeChildren: false });
      assert(!directRoot.items.some((item) => item.document_id === mainDoc.document.id), "root без потомков не должен видеть документ из branchA/branchB");

      const fullRoot = await search(RUN_ID, { nodeId: root.id, includeChildren: true });
      assert(fullRoot.items.some((item) => item.document_id === mainDoc.document.id), "root с потомками должен видеть документ");

      const childOnly = await search(RUN_ID, { nodeId: childA.id, includeChildren: false });
      assert(!childOnly.items.some((item) => item.document_id === mainDoc.document.id), "пустой дочерний раздел не должен видеть документ родителя");
      return `root with children=${fullRoot.items.length}`;
    });

    await step("4. Rename узла обновляет node_paths в payload", async () => {
      const renamed = `${RUN_ID} branch A renamed`;
      const data = await api("PATCH", `/nodes/${branchA.id}`, { name: renamed });
      assert(data.ok === true && data.sync?.ok === true, "PATCH узла должен вернуть успешную sync");
      branchA = data.node;

      const links = await api("GET", `/documents/${mainDoc.document.id}/nodes`);
      assert(
        links.payload.node_paths.some((path) => path.includes(renamed)),
        "payload node_paths должен содержать новое имя раздела"
      );
      return `paths=${links.payload.node_paths.join(" | ")}`;
    });

    await step("5. Move узла обновляет scope и поиск через нового родителя", async () => {
      const data = await api("POST", `/nodes/${branchA.id}/move`, { newParentId: moveParent.id });
      assert(data.ok === true && data.sync?.ok === true, "move должен вернуть успешную sync");
      branchA = data.node;

      const scoped = await search(RUN_ID, { nodeId: moveParent.id, includeChildren: true });
      assert(scoped.items.some((item) => item.document_id === mainDoc.document.id), "новый родитель должен видеть документ");

      const ancestors = await api("GET", `/nodes/${branchA.id}/ancestors?includeSelf=false`);
      assert(ancestors.items.some((item) => item.id === moveParent.id), "moveParent должен быть предком branchA");
      return "document found under moved parent";
    });

    await step("6. Move узла внутрь собственного потомка запрещён", async () => {
      const data = await api(
        "POST",
        `/nodes/${moveParent.id}/move`,
        { newParentId: branchA.id },
        { statuses: [409] }
      );
      assert(data.ok === false, "Ожидал отказ по циклу");
      return data.error;
    });

    await step("7. Delete узла с документом блокируется, затем move_to_parent перепривязывает", async () => {
      deleteDoc = await createTextDocument(
        `${RUN_ID} delete strategy`,
        `Документ ${RUN_ID} для проверки delete strategy move_to_parent.`,
        [deleteTarget.id],
        deleteTarget.id,
        ["delete-strategy"]
      );

      const blocked = await api(
        "DELETE",
        `/nodes/${deleteTarget.id}?strategy=block`,
        undefined,
        { statuses: [409] }
      );
      assert(blocked.ok === false, "Удаление с документами без стратегии должно быть запрещено");

      const moved = await api("DELETE", `/nodes/${deleteTarget.id}?strategy=move_to_parent`);
      assert(moved.ok === true, "move_to_parent должен удалить узел");

      const links = await api("GET", `/documents/${deleteDoc.document.id}/nodes`);
      assert(links.links.some((link) => link.nodeId === root.id), "Документ должен перепривязаться к родителю");
      return "block=409, move_to_parent=ok";
    });

    await step("8. /ask на пустом scope не утекает в другие разделы", async () => {
      const answer = await api("POST", "/ask", {
        question: `ZZZ_${RUN_ID}_NO_SOURCE`,
        nodeId: emptyScope.id,
        includeChildren: true,
        limit: 3,
      });
      assert(answer.mode === "fallback-empty", "Ожидал fallback-empty");
      assert(Array.isArray(answer.sources) && answer.sources.length === 0, "Источников быть не должно");
      assert(answer.answer.includes("выбранном разделе"), "Ответ должен явно говорить о выбранном разделе");
      return answer.answer;
    });

    await step("9. Manual reconciliation работает для документа", async () => {
      const data = await api(
        "POST",
        `/admin/reindex-nodes?scope=document&id=${encodeURIComponent(mainDoc.document.id)}`
      );
      assert(data.ok === true, "reindex-nodes должен завершиться ok");
      assert(data.expectedPoints >= 1, "У тестового документа должны быть Qdrant points");
      assert(data.updatedPoints >= 1, "Payload должен быть обновлён хотя бы у одной точки");
      return `updated=${data.updatedPoints}/${data.expectedPoints}`;
    });

    await step("10. Bulk-link 50 документов обновляет scope", async () => {
      for (let index = 1; index <= 50; index += 1) {
        const doc = await createTextDocument(
          `${RUN_ID} bulk ${String(index).padStart(2, "0")}`,
          `Bulk smoke document ${RUN_ID} number ${index}. Проверка массовой привязки разделов.`,
          [root.id],
          root.id,
          ["bulk"]
        );
        bulkDocs.push(doc.document.id);
        if (index % 10 === 0) {
          console.log(`progress - создано bulk документов: ${index}/50`);
        }
      }

      const linked = await api("POST", "/documents/bulk-link", {
        documentIds: bulkDocs,
        nodeIds: [bulkNode.id],
        mode: "add",
      });
      assert(linked.updatedDocuments === 50, "bulk-link должен обновить 50 документов");

      const docs = await api("GET", `/nodes/${bulkNode.id}/documents?includeChildren=false&limit=100`);
      const found = docs.items.filter((item) => bulkDocs.includes(item.id)).length;
      assert(found === 50, `Ожидал 50 документов в bulkNode, найдено ${found}`);
      return "50/50";
    });

    await step("11. Параллельные rename + ingest в одном узле не ломают state", async () => {
      const renamed = `${RUN_ID} race renamed`;
      const [renameResult, ingestResult] = await Promise.all([
        api("PATCH", `/nodes/${raceNode.id}`, { name: renamed }),
        createTextDocument(
          `${RUN_ID} race ingest`,
          `Race smoke document ${RUN_ID}. Проверка параллельного rename и ingest.`,
          [raceNode.id],
          raceNode.id,
          ["race"]
        ),
      ]);
      raceNode = renameResult.node;
      assert(renameResult.ok === true, "rename должен завершиться ok");
      assert(ingestResult.document?.id, "ingest должен создать документ");

      const reindexed = await api(
        "POST",
        `/admin/reindex-nodes?scope=document&id=${encodeURIComponent(ingestResult.document.id)}`
      );
      assert(reindexed.ok === true, "повторная сверка payload должна быть идемпотентной");
      const links = await api("GET", `/documents/${ingestResult.document.id}/nodes`);
      assert(links.payload.node_paths.some((path) => path.includes(renamed)), "payload должен содержать актуальное имя после сверки");
      return `doc=${ingestResult.document.id}`;
    });

    await step("12. Документ загружается сразу в 3 раздела с primary", async () => {
      triDoc = await createTextDocument(
        `${RUN_ID} three nodes`,
        `Three-node smoke document ${RUN_ID}. Проверка nodeIds из трёх разделов.`,
        [triA.id, triB.id, triC.id],
        triB.id,
        ["three-nodes"]
      );
      const links = await api("GET", `/documents/${triDoc.document.id}/nodes`);
      assert(links.links.length === 3, "Ожидал 3 привязки");
      assert(links.payload.primary_node_id === triB.id, "primary должен быть triB");
      assert(links.payload.node_ids.length === 3, "payload должен содержать 3 node_ids");
      return "3 links";
    });

    await step("13. Удаление документа чистит vectors/links", async () => {
      const query = `${RUN_ID} three nodes`;
      const before = await search(query, { nodeId: triB.id, includeChildren: false });
      assert(before.items.some((item) => item.document_id === triDoc.document.id), "Документ должен находиться до удаления");

      const removed = await api("DELETE", `/documents/${triDoc.document.id}?removeStoredFile=true`);
      assert(removed.removedVectors >= 1, "Удаление должно убрать Qdrant vectors");

      const after = await search(query, { nodeId: triB.id, includeChildren: false });
      assert(!after.items.some((item) => item.document_id === triDoc.document.id), "Удалённый документ не должен находиться");
      createdDocumentIds.splice(createdDocumentIds.indexOf(triDoc.document.id), 1);
      return `removedVectors=${removed.removedVectors}`;
    });

    await step("14. URL deep-link страниц и /ui/state работают", async () => {
      const savedState = await api("POST", "/ui/state", {
        currentNodeId: root.id,
        includeChildren: false,
      });
      assert(savedState.state?.currentNodeId === root.id, "/ui/state должен сохранить текущий раздел");
      assert(savedState.state?.includeChildren === false, "/ui/state должен сохранить includeChildren=false");

      const loadedState = await api("GET", "/ui/state");
      assert(loadedState.state?.currentNodeId === root.id, "/ui/state должен вернуть сохранённый раздел");

      const pages = [
        `/ui/consult?nodeId=${encodeURIComponent(root.id)}&includeChildren=true`,
        `/ui/ingest?nodeId=${encodeURIComponent(root.id)}&includeChildren=true`,
        `/ui/jobs?nodeId=${encodeURIComponent(root.id)}&includeChildren=true`,
        `/ui/pages-search?nodeId=${encodeURIComponent(root.id)}&includeChildren=true`,
        `/ui/nodes?nodeId=${encodeURIComponent(root.id)}`,
      ];

      for (const page of pages) {
        const response = await fetch(`${BASE_URL}${page}`);
        assert(response.ok, `${page} должен отдаваться HTTP 200`);
        const html = await response.text();
        assert(html.includes("LOCAL-RAG-PLATFORM") || html.includes("Разделы базы"), `${page} должен быть HTML UI`);
      }
      return `${pages.length} pages, state=${loadedState.state.currentNodeId}`;
    });

    await step("15. Теги scoped: metso/RAMPT положительный, книга/RAMPT отрицательный", async () => {
      const metso = await search("RAMPT", { selectedTags: ["metso"], limit: 4 });
      assert(metso.items.some((item) => item.title === "g2043_ru_04-1.pdf"), "metso/RAMPT должен находить g2043_ru_04-1.pdf");

      const book = await search("RAMPT", { selectedTags: ["книга"], limit: 4 });
      assert(book.items.length === 0, "книга/RAMPT не должен находить источники");
      return `metso=${metso.items.length}, книга=${book.items.length}`;
    });

    await step("16. /nodes отдаёт ETag/304, readiness учитывает node_counters", async () => {
      const response = await fetch(`${BASE_URL}/nodes?format=tree&includeInactive=true`);
      assert(response.ok, "/nodes должен вернуть HTTP 200");
      const etag = response.headers.get("etag");
      assert(etag, "/nodes должен вернуть ETag");

      const cached = await fetch(`${BASE_URL}/nodes?format=tree&includeInactive=true`, {
        headers: { "if-none-match": etag },
      });
      assert(cached.status === 304, "/nodes должен вернуть 304 по If-None-Match");

      const status = await api("GET", "/admin/knowledge-nodes-status");
      assert(status.progressPercent === 100, "knowledge nodes readiness должен быть 100%");
      assert(status.stats?.nodeCountersMissingRows === 0, "node_counters должен быть заполнен для всех узлов");
      return `etag=${etag}, checks=${status.passed}/${status.total}`;
    });

    await step("17. cascade_documents требует двойного подтверждения и удаляет только smoke scope", async () => {
      const cascadeRoot = await createNode(`${RUN_ID} cascade root`, root.id);
      const cascadeChild = await createNode(`${RUN_ID} cascade child`, cascadeRoot.id);
      const cascadeDoc = await createTextDocument(
        `${RUN_ID} cascade document`,
        `Cascade smoke document ${RUN_ID}. Проверка опасного удаления только на временных данных.`,
        [cascadeChild.id],
        cascadeChild.id,
        ["cascade"]
      );

      const blocked = await api(
        "DELETE",
        `/nodes/${encodeURIComponent(cascadeRoot.id)}?strategy=cascade_documents`,
        undefined,
        { statuses: [400] }
      );
      assert(blocked.ok === false, "cascade_documents без confirm должен быть заблокирован");

      const deleted = await api(
        "DELETE",
        `/nodes/${encodeURIComponent(cascadeRoot.id)}?strategy=cascade_documents`,
        {
          confirm: "DELETE_DOCUMENTS_AND_NODE",
          confirmName: cascadeRoot.name,
        }
      );
      assert(deleted.ok === true, "cascade_documents с двойным подтверждением должен завершиться ok");
      assert(deleted.deletedDocuments >= 1, "cascade_documents должен удалить временный документ");
      assert(deleted.deletedNodes >= 2, "cascade_documents должен удалить корень и потомка");

      untrackCreated("document", cascadeDoc.document.id);
      untrackCreated("node", cascadeChild.id);
      untrackCreated("node", cascadeRoot.id);
      return `documents=${deleted.deletedDocuments}, nodes=${deleted.deletedNodes}`;
    });

    await step("18. Manual sample reconciliation endpoint работает", async () => {
      const data = await api("POST", "/admin/reconcile-nodes-sample", { limit: 3 });
      assert(data.ok === true, "manual sample reconciliation должен вернуть ok");
      assert(data.checkedDocuments <= 3, "sample limit должен ограничивать количество документов");
      return `checked=${data.checkedDocuments}, updatedPoints=${data.updatedPoints}`;
    });

    await step("19. open-local возвращает helper-контракт для raw-документа", async () => {
      const docs = await api("GET", "/documents?limit=100");
      const rawDoc = (docs.items || []).find((item) => {
        const rawPath = String(item.original_file_path || item.originalFilePath || "");
        return rawPath && !rawPath.includes(RUN_ID);
      });
      if (!rawDoc) {
        return "raw-документ не найден, проверка пропущена";
      }

      const data = await api("POST", `/documents/${encodeURIComponent(rawDoc.id)}/open-local`);
      assert(data.ok === true, "open-local должен вернуть ok");
      assert(data.mode === "local-helper", "open-local должен вернуть mode=local-helper");
      assert(data.token && data.path && (data.helper_url || data.helperUrl), "open-local должен вернуть token, path и helper_url");
      return `helper=${data.helper_url || data.helperUrl}`;
    });
  } finally {
    await cleanup();
  }

  const failed = results.filter((item) => !item.ok);
  console.log(`summary - passed=${results.length - failed.length}, failed=${failed.length}`);
  if (failed.length > 0) {
    process.exitCode = 1;
  }
}

main().catch(async (error) => {
  console.error(error);
  try {
    await cleanup();
  } catch (cleanupError) {
    console.error(cleanupError);
  }
  process.exitCode = 1;
});

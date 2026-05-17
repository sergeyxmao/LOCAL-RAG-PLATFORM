#!/usr/bin/env node
// Генератор тестовых XLSX/XLS фикстур для парсера графа знаний.
// Запуск: node tests/fixtures/generate-graph-fixtures.mjs
// Требует `xlsx` из apps/kb-api/node_modules (или установлен глобально).
//
// Создаёт:
//   tests/fixtures/metso-mini.xlsx — формат metso_dna_rio (один лист = шкаф).
//   tests/fixtures/koyo-mini.xls   — формат koyo_directlogic_pro (AI/AO/DI/DO).
//   tests/fixtures/unrecognized-mini.xlsx — посторонняя структура, профиль не подберётся.
//   tests/fixtures/metso-with-exotic-kind.xlsx — содержит signal_kind "HART"
//     (нет в alias-конфиге) — для проверки warning signal_kind_unknown.

import path from "node:path";
import url from "node:url";
import { createRequire } from "node:module";

const here = path.dirname(url.fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "..", "..");
const require = createRequire(path.join(repoRoot, "apps/kb-api/package.json"));
const XLSX = require("xlsx");

function padRow(width) {
  // Sheetjs `aoa_to_sheet` collapses rows with no cells; force a placeholder
  // string so the row exists in the workbook and `header_row`/`data_start_row`
  // соответствуют реальному номеру строки.
  return Array.from({ length: width }, () => "");
}

function buildMetsoMini() {
  // Лист _IO-06: header_row=1, data_start_row=4
  // Row 1: заголовки (LOOPTAG, DEVICETAG, CARH_TYPE, ADDRESS, STATION, CHANEL, Group TYPE, Наименование)
  // Row 2-3: служебные / разделитель
  // Row 4+: данные
  const W = 10;
  const rows = [
    [
      "LOOPTAG", "DEVICETAG", "CARH_TYPE", "ADDRESS",
      "STATION", "CHANEL", "Group TYPE", "Наименование",
      "CARD PINs", "Name wire",
    ],
    padRow(W),
    padRow(W),
    [
      "KS_T2B1", "TTBK1", "AII8C", "2:0:0:0",
      "DP01", "0", "1AI", "Температура масла Б1",
      "1-2", "W001",
    ],
    [
      "KS_T2B2", "TTBK2", "AII8C", "2:0:0:0",
      "DP01", "1", "1AI", "Температура масла Б2",
      "3-4", "W002",
    ],
    [
      "KS_P1", "PT01", "AII8C", "2:0:0:0",
      "DP01", "2", "1AI", "Давление масла",
      "5-6", "W003",
    ],
    [
      "Резерв-1", "", "AII8C", "2:0:0:0",
      "DP01", "3", "1AI", "Резерв",
      "7-8", "",
    ],
    [
      "KS_V1", "MV01", "DOO8", "2:0:1:0",
      "DP01", "0", "1DO", "Команда открыть клапан",
      "1-2", "W101",
    ],
  ];
  const sheet = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet, "_IO-06");
  XLSX.writeFile(wb, path.join(here, "metso-mini.xlsx"));
}

function buildKoyoMini() {
  // Листы AI/AO/DI/DO: header_row=3, data_start_row=4
  function makeSheet(extraTagHeader, dataRows) {
    const W = 7;
    const rows = [
      padRow(W), padRow(W),
      [extraTagHeader, "Позиция", "Наименование параметра", "Модуль", "Место", "Клемма", "Память"],
      ...dataRows,
    ];
    return XLSX.utils.aoa_to_sheet(rows);
  }
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, makeSheet("Tag Name", [
    ["AI001", "TT-01", "Температура входа", "F4-04AD", "0", "0", "V2000"],
    ["AI002", "TT-02", "Температура выхода", "F4-04AD", "0", "1", "V2001"],
    ["AI003", "PT-01", "Давление", "F4-04AD", "0", "2", "V2002"],
  ]), "AI");
  XLSX.utils.book_append_sheet(wb, makeSheet("Tag", [
    ["DI001", "ZS-01", "Концевик клапана 1", "D4-16ND2", "1", "0", "X0"],
    ["DI002", "ZS-02", "Концевик клапана 2", "D4-16ND2", "1", "1", "X1"],
  ]), "DI");
  XLSX.utils.book_append_sheet(wb, makeSheet("Tag", [
    ["DO001", "YV-01", "Команда клапан 1", "D4-16TD2", "2", "0", "Y0"],
    ["DO002", "YV-02", "Команда клапан 2", "D4-16TD2", "2", "1", "Y1"],
  ]), "DO");
  XLSX.utils.book_append_sheet(wb, makeSheet("Tag", [
    ["AO001", "FY-01", "Уставка частоты", "F4-08DA", "3", "0", "V3000"],
  ]), "AO");
  // .xls = BIFF8 формат
  XLSX.writeFile(wb, path.join(here, "koyo-mini.xls"), { bookType: "biff8" });
}

function buildUnrecognizedMini() {
  // XLSX без LOOPTAG/AI/AO — профили не подойдут
  const rows = [
    ["Name", "Description"],
    ["foo", "bar"],
  ];
  const sheet = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet, "Random");
  XLSX.writeFile(wb, path.join(here, "unrecognized-mini.xlsx"));
}

function buildMetsoWithExoticKind() {
  // metso-формат с экзотическим signal_kind "HART", который не в alias-конфиге
  const W = 8;
  const rows = [
    [
      "LOOPTAG", "DEVICETAG", "CARH_TYPE", "ADDRESS",
      "STATION", "CHANEL", "Group TYPE", "Наименование",
    ],
    padRow(W), padRow(W),
    [
      "KS_X1", "HX01", "HART4", "9:0:0:0",
      "DP99", "0", "HART", "Экзотический сигнал HART",
    ],
    [
      "KS_X2", "HX02", "HART4", "9:0:0:0",
      "DP99", "1", "Modbus RTU", "Сигнал по Modbus",
    ],
  ];
  const sheet = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet, "_IO-99");
  XLSX.writeFile(wb, path.join(here, "metso-with-exotic-kind.xlsx"));
}

buildMetsoMini();
buildKoyoMini();
buildUnrecognizedMini();
buildMetsoWithExoticKind();
console.log("Сгенерированы:");
console.log("  metso-mini.xlsx");
console.log("  koyo-mini.xls");
console.log("  unrecognized-mini.xlsx");
console.log("  metso-with-exotic-kind.xlsx");

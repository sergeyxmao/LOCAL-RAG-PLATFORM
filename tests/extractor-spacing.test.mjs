// Юнит-тесты восстановления пробелов в извлечённом из PDF тексте.
// Запуск: node --test tests/extractor-spacing.test.mjs
//
// Тестируем чистые функции из extractorService.js на синтетических items,
// без обращения к pdfjs/диску/БД. items имитируют то, что pdfjs отдаёт в
// textContent.items: { str, transform: [scaleX, 0, 0, scaleY, x, y],
// width, height, hasEOL }.

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  buildPageTextWithSpacing,
  repairGluedSegment,
} from "../apps/kb-api/src/services/pdfTextSpacing.js";

// Helper для синтетического item с координатами.
function item(str, { x = 0, y = 100, width = null, fontHeight = 10, hasEOL = false } = {}) {
  const computedWidth = width ?? str.length * fontHeight * 0.5;
  return {
    str,
    transform: [fontHeight, 0, 0, fontHeight, x, y],
    width: computedWidth,
    height: fontHeight,
    hasEOL,
  };
}

test("buildPageTextWithSpacing: вставляет пробел между items при горизонтальном зазоре", () => {
  // Три слова с заметным зазором: «Блок» + «ACU» + «имеет».
  const items = [
    item("Блок", { x: 0, y: 100, width: 30 }),
    item("ACU", { x: 35, y: 100, width: 20 }), // зазор = 5 при fontHeight=10 → > 2.5 → пробел
    item("имеет", { x: 60, y: 100, width: 40 }), // зазор = 5
  ];
  const text = buildPageTextWithSpacing(items);
  assert.equal(text, "Блок ACU имеет");
});

test("buildPageTextWithSpacing: НЕ вставляет пробел при близких items (gap < threshold)", () => {
  // Два куска вплотную — например, код модуля разделён pdfjs на два item.
  const items = [
    item("AIU", { x: 0, y: 100, width: 15, fontHeight: 10 }),
    item("8H", { x: 15.5, y: 100, width: 10, fontHeight: 10 }), // зазор 0.5 < 2.5 → склейка
  ];
  const text = buildPageTextWithSpacing(items);
  assert.equal(text, "AIU8H");
});

test("buildPageTextWithSpacing: разные Y → пробел (новая строка)", () => {
  const items = [
    item("первая строка", { x: 0, y: 100, width: 60 }),
    item("вторая строка", { x: 0, y: 80, width: 60 }), // dy=20 > fontHeight*0.5 → новая строка
  ];
  const text = buildPageTextWithSpacing(items);
  assert.equal(text, "первая строка вторая строка");
});

test("buildPageTextWithSpacing: hasEOL у предыдущего item → пробел", () => {
  const items = [
    item("конец строки", { x: 0, y: 100, width: 60, hasEOL: true }),
    item("новая строка", { x: 0, y: 100, width: 60 }),
  ];
  const text = buildPageTextWithSpacing(items);
  assert.equal(text, "конец строки новая строка");
});

test("buildPageTextWithSpacing: НЕ разрывает технические коды внутри одного item.str", () => {
  // pdfjs отдал код модуля одним item — внутри не трогаем.
  const items = [
    item("Модуль", { x: 0, y: 100, width: 40 }),
    item("AIU8H", { x: 45, y: 100, width: 25 }),
    item("установлен", { x: 75, y: 100, width: 60 }),
  ];
  const text = buildPageTextWithSpacing(items);
  assert.equal(text, "Модуль AIU8H установлен");
});

test("buildPageTextWithSpacing: серийный номер с буквами и цифрами не разрывается", () => {
  const items = [
    item("Серийный", { x: 0, y: 100, width: 50 }),
    item("A413165", { x: 55, y: 100, width: 35 }),
  ];
  const text = buildPageTextWithSpacing(items);
  assert.equal(text, "Серийный A413165");
});

test("buildPageTextWithSpacing: пустые items без EOL пропускаются", () => {
  const items = [
    item("слово1", { x: 0, y: 100, width: 30 }),
    { str: "", transform: [10, 0, 0, 10, 35, 100], width: 0, height: 10, hasEOL: false },
    item("слово2", { x: 40, y: 100, width: 30 }),
  ];
  const text = buildPageTextWithSpacing(items);
  assert.equal(text, "слово1 слово2");
});

test("buildPageTextWithSpacing: TextMarkedContent (без str) пропускается", () => {
  const items = [
    item("текст", { x: 0, y: 100, width: 30 }),
    { type: "beginMarkedContent", id: "x1" },
    item("ещё", { x: 35, y: 100, width: 20 }),
  ];
  const text = buildPageTextWithSpacing(items);
  assert.equal(text, "текст ещё");
});

test("buildPageTextWithSpacing: items без transform — консервативно через пробел", () => {
  const items = [
    { str: "слово1", transform: null, width: 0, height: 10, hasEOL: false },
    { str: "слово2", transform: null, width: 0, height: 10, hasEOL: false },
  ];
  const text = buildPageTextWithSpacing(items);
  assert.equal(text, "слово1 слово2");
});

test("buildPageTextWithSpacing: схлопывает двойные пробелы", () => {
  const items = [
    item("  слово  ", { x: 0, y: 100, width: 50 }),
    item("  другое  ", { x: 60, y: 100, width: 50 }),
  ];
  const text = buildPageTextWithSpacing(items);
  // Внутри item.str двойные пробелы схлопываются финальным .replace(/[ \t]+/g, " ").
  assert.equal(text, "слово другое");
});

test("buildPageTextWithSpacing: пустой массив → пустая строка", () => {
  assert.equal(buildPageTextWithSpacing([]), "");
  assert.equal(buildPageTextWithSpacing(null), "");
  assert.equal(buildPageTextWithSpacing(undefined), "");
});

// === repairGluedSegment ===

test("repairGluedSegment: короткий код модуля AIU8H НЕ трогается (< порога)", () => {
  assert.equal(repairGluedSegment("AIU8H"), "AIU8H");
});

test("repairGluedSegment: серийник A413165 НЕ трогается (< порога)", () => {
  assert.equal(repairGluedSegment("A413165"), "A413165");
});

test("repairGluedSegment: длинный латинский код НЕ разрывается (не кириллица)", () => {
  // Длинный латинский код вроде SN-A413165-AIU8H — длина > 20, но это всё латиница+цифры.
  // По правилам не трогаем латиница+цифры. Lowercase→Uppercase Latin тоже не трогаем.
  // Пример (без дефиса): "PostgreSQLDatabaseConnection" — Latin CamelCase, не разрывать.
  const input = "PostgreSQLDatabaseConnection";
  assert.equal(repairGluedSegment(input), input);
});

test("repairGluedSegment: длинный с пробелами внутри НЕ трогается", () => {
  // Если хотя бы один пробел уже есть, считаем что pdfjs нормально разделил — не вмешиваемся.
  const input = "это уже нормально разделено и не должно меняться никак";
  assert.equal(repairGluedSegment(input), input);
});

test("repairGluedSegment: «БлокACU...» — кириллица↔латиница и буква↔цифра вставляют пробелы", () => {
  const input = "БлокACUимеетдвавхода0/4-20мАили0/2-10В";
  const out = repairGluedSegment(input);
  // Ключевые границы, которые ДОЛЖНЫ появиться:
  assert.match(out, /Блок ACU/u, "кириллица→латиница");
  assert.match(out, /ACU имеет/u, "латиница→кириллица");
  assert.match(out, /входа 0/u, "кириллица→цифра");
  assert.match(out, /20 мА/u, "цифра→кириллица");
  assert.match(out, /10 В/u, "цифра→кириллица (одиночная буква)");
});

test("repairGluedSegment: кириллический CamelCase «вышеЗначение» → «выше Значение»", () => {
  const input = "СрезВыше ЗначенияТекущегоПорогаНадоПроверитьИзменение";
  // Длина > 20, без внутренних пробелов? Проверим: пробел уже есть → не трогаем.
  // Поэтому возьмём пример без пробелов.
  const input2 = "СрезВышеЗначенияТекущегоПорогаНадоПроверитьИзменение";
  const out = repairGluedSegment(input2);
  // Должны появиться пробелы перед заглавными внутри кириллицы.
  assert.match(out, /Срез Выше/u);
  assert.match(out, /Выше Значения/u);
});

test("repairGluedSegment: смешанный «ACUимеетAIU8Hвход» — латиница+цифры не разрываем", () => {
  // ACU + имеет → "ACU имеет" (латиница→кириллица)
  // AIU8H → должен остаться целым (латиница+цифры; границ кириллицы внутри нет)
  // 8H + вход → НЕ кириллица↔цифра (8 не кириллица, H не кириллица), не трогаем
  // Hвход → латиница→кириллица → пробел
  const input = "АктивенACUимеетмодульAIU8HвходРабочий";
  const out = repairGluedSegment(input);
  assert.match(out, /Активен ACU/u);
  assert.match(out, /ACU имеет/u);
  assert.match(out, /модуль AIU8H/u);
  // ВАЖНО: внутри AIU8H никаких пробелов
  assert.ok(!/AIU 8H|AIU8 H|AI U8H/u.test(out), `AIU8H разорван: ${out}`);
  assert.match(out, /H вход/u, "латиница→кириллица после кода");
});

test("repairGluedSegment: «выше120мА» — кириллица→цифра и цифра→кириллица", () => {
  // 13 символов — короче порога 20, не трогаем.
  assert.equal(repairGluedSegment("выше120мА"), "выше120мА");
  // А в составе длинного — разорвём.
  const out = repairGluedSegment("значениевыше120мАпотомснижается");
  assert.match(out, /выше 120/u);
  assert.match(out, /120 мА/u);
});

test("repairGluedSegment: только цифры/дефисы — не трогаем", () => {
  // Чистая числовая строка без букв — не должна меняться.
  const input = "0/4-20/0-1/5-0/2-10/12-15/100-200/300-400";
  assert.equal(repairGluedSegment(input), input);
});

// === Интеграционный тест: целевой кейс из ТЗ ===

test("buildPageTextWithSpacing+repairGluedSegment: целевой кейс ACU из ТЗ", () => {
  // Имитируем худший случай: pdfjs склеил всю фразу про ACU в один item.
  // Координатный фикс не разобьёт внутри item, но вторичная эвристика поможет
  // вокруг границ кириллица↔латиница и буква↔цифра.
  const items = [
    item("БлокACUимеетдвааналоговыхпереключаемыхвходавинтервалах0/4-20мА", {
      x: 0,
      y: 100,
      width: 300,
    }),
  ];
  const text = buildPageTextWithSpacing(items);
  // Ключевые границы, которые должны починиться:
  assert.match(text, /Блок ACU/u);
  assert.match(text, /ACU имеет/u, "ACU → кириллица должно быть с пробелом");
  assert.match(text, /20 мА/u);
});

test("buildPageTextWithSpacing+repairGluedSegment: смешанный — items раздельные, но без пробелов между", () => {
  // Реалистичный случай: pdfjs отдал нормальные items по словам, но без пробелов между ними.
  // Координатный фикс должен сделать своё дело без участия вторичной эвристики.
  const items = [
    item("Блок", { x: 0, y: 100, width: 30 }),
    item("ACU", { x: 35, y: 100, width: 20 }),
    item("имеет", { x: 60, y: 100, width: 40 }),
    item("два", { x: 105, y: 100, width: 20 }),
    item("аналоговых", { x: 130, y: 100, width: 70 }),
    item("входа", { x: 205, y: 100, width: 40 }),
    item("0/4-20", { x: 250, y: 100, width: 40 }),
    item("мА", { x: 295, y: 100, width: 15 }),
  ];
  const text = buildPageTextWithSpacing(items);
  assert.equal(text, "Блок ACU имеет два аналоговых входа 0/4-20 мА");
});

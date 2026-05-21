// Чистые функции восстановления пробелов в тексте, извлечённом из PDF.
// Вынесены из extractorService.js в отдельный модуль, чтобы быть тестируемыми
// независимо от тяжёлых зависимостей (pdfjs-dist, mammoth, xlsx).

// Порог: items длиннее ~20 символов без единого пробела — кандидаты на «слипшийся» текст.
const GLUED_SEGMENT_MIN_LENGTH = 20;

// Восстановление пробелов внутри уже отданного pdfjs одним куском item.str:
// действует только если кусок длинный И без внутренних пробелов (т.е. вероятно склейка).
// Кириллица↔латиница и кириллица↔цифра — разделяются; латиница+цифры (коды модулей
// AIU8H, BIU4, AIR8C, A413165) — НЕ трогаются.
export function repairGluedSegment(str) {
  if (typeof str !== "string" || str.length < GLUED_SEGMENT_MIN_LENGTH) {
    return str;
  }
  if (/\s/.test(str)) {
    return str;
  }

  let result = str;

  // 1. Граница кириллица↔латиница (в любом направлении, любой регистр): разделить.
  //    "БлокACU" → "Блок ACU", "ACUимеет" → "ACU имеет".
  //    Чистая латиница ("PostgreSQL") и чистая кириллица не затрагиваются.
  result = result.replace(/(\p{Script=Cyrillic})(\p{Script=Latin})/gu, "$1 $2");
  result = result.replace(/(\p{Script=Latin})(\p{Script=Cyrillic})/gu, "$1 $2");

  // 2. Граница строчная→ЗАГЛАВНАЯ только если обе буквы кириллические И
  //    перед заглавной идёт не менее 3 строчных кириллических подряд.
  //    "вышеЗначение" → "выше Значение"; единицы измерения "мА", "кВт", "мкФ"
  //    с короткими строчными префиксами НЕ затрагиваются.
  //    Latin CamelCase ("PostgreSQL") сохраняется в любом случае.
  result = result.replace(/(\p{Ll}{3,})(\p{Lu})/gu, (match, lo, up) => {
    const lastLower = lo[lo.length - 1];
    if (
      /\p{Script=Cyrillic}/u.test(lastLower) &&
      /\p{Script=Cyrillic}/u.test(up)
    ) {
      return `${lo} ${up}`;
    }
    return match;
  });

  // 3. Граница кириллическая буква↔цифра в обе стороны.
  //    "20мА" → "20 мА", "напряжение220" → "напряжение 220".
  //    Латиница+цифры (AIU8H, A413165) сюда НЕ попадают.
  result = result.replace(/(\p{Script=Cyrillic})(\d)/gu, "$1 $2");
  result = result.replace(/(\d)(\p{Script=Cyrillic})/gu, "$1 $2");

  return result;
}

// Сборка текста страницы PDF из items с восстановлением пробелов по координатам.
// Принцип: между двумя последовательными items проверяем горизонтальный зазор
// (currentX − prevRight). Если зазор больше доли высоты шрифта (~0.25),
// между ними нужен пробел. Если items на разных Y — это новая строка → пробел.
// Внутри одного item.str пробелы НЕ вставляются (защищает теги/коды),
// кроме отдельного шага вторичной эвристики repairGluedSegment.
export function buildPageTextWithSpacing(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return "";
  }

  const parts = [];
  let prev = null;

  for (const item of items) {
    if (!item || typeof item !== "object" || !("str" in item)) {
      continue;
    }
    const str = typeof item.str === "string" ? item.str : "";
    const hasEOL = Boolean(item.hasEOL);
    if (str === "" && !hasEOL) {
      // пустые фрагменты без EOL — служебные, пропускаем
      continue;
    }

    const transform = Array.isArray(item.transform) ? item.transform : null;
    const x = transform && Number.isFinite(transform[4]) ? transform[4] : null;
    const y = transform && Number.isFinite(transform[5]) ? transform[5] : null;
    const fontHeight = transform
      ? Math.abs(transform[3]) || Math.abs(transform[0]) || Number(item.height) || 10
      : Number(item.height) || 10;
    const width = Number.isFinite(item.width) ? item.width : 0;

    if (prev) {
      let needSpace = false;
      if (prev.hasEOL) {
        needSpace = true;
      } else if (prev.x === null || x === null || prev.y === null || y === null) {
        // Координат нет — консервативно: пробел между фрагментами.
        needSpace = true;
      } else {
        const sameLine = Math.abs(prev.y - y) < fontHeight * 0.5;
        if (!sameLine) {
          needSpace = true;
        } else {
          const gap = x - (prev.x + prev.width);
          // Порог: ~25% от высоты шрифта. Эмпирически близко к ширине пробела.
          const spaceThreshold = fontHeight * 0.25;
          if (gap > spaceThreshold) {
            needSpace = true;
          }
        }
      }

      const lastPart = parts.length > 0 ? parts[parts.length - 1] : "";
      const endsWithSpace = lastPart && /\s$/.test(lastPart);
      if (needSpace && !endsWithSpace) {
        parts.push(" ");
      }
    }

    if (str) {
      parts.push(repairGluedSegment(str));
    }

    prev = {
      x,
      y,
      width,
      hasEOL,
    };
  }

  return parts.join("").replace(/[ \t]+/g, " ").trim();
}

/**
 * Furigana utilities for rendering Japanese text with reading guides
 * Converts kanji + hiragana reading into HTML ruby tags
 */

/**
 * Determines if a character is a kanji (Chinese character used in Japanese)
 * Kanji is in the range U+4E00 to U+9FFF
 */
function isKanji(char) {
  const code = char.charCodeAt(0);
  return code >= 0x4e00 && code <= 0x9fff;
}

/**
 * Segments Japanese text into kanji groups and hiragana
 * Returns an array of { type: 'kanji' | 'hiragana', text: string }
 */
function segmentJapaneseText(text) {
  const segments = [];
  let currentSegment = "";
  let currentType = null;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const charIsKanji = isKanji(char);
    const charType = charIsKanji ? "kanji" : "hiragana";

    if (currentType === null) {
      currentType = charType;
      currentSegment = char;
    } else if (currentType === charType) {
      currentSegment += char;
    } else {
      segments.push({ type: currentType, text: currentSegment });
      currentType = charType;
      currentSegment = char;
    }
  }

  if (currentSegment) {
    segments.push({ type: currentType, text: currentSegment });
  }

  return segments;
}

/**
 * Aligns kanji with their readings using suffix-stripping and look-ahead matching.
 *
 * Strategy:
 *   1. Walk through segments in order, tracking remaining reading.
 *   2. When a hiragana segment is encountered, strip it from the front of the
 *      remaining reading (because it is already visible in the plain text).
 *   3. When a kanji segment is encountered, look ahead to the next hiragana
 *      segment and consume everything in the reading up to (but not including)
 *      that hiragana — that portion belongs to the kanji.
 *   4. The last kanji segment gets all remaining reading after stripping any
 *      trailing okurigana that follow it.
 *
 * Examples:
 *   始める / はじめる  → 始(はじ)める
 *   覚える / おぼえる  → 覚(おぼ)える
 *   引っ越す / ひっこす → 引(ひ)っ越(こ)す
 *   乗り越える / のりこえる → 乗(の)り越(こ)える
 */
function alignKanjiWithReadings(segments, fullReading) {
  const kanjiSegments = segments.filter((s) => s.type === "kanji");
  if (kanjiSegments.length === 0) return [];

  const alignments = [];
  let remaining = fullReading;
  let kanjiIdx = 0;

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];

    if (seg.type === "hiragana") {
      // Strip this hiragana from the front of the remaining reading
      if (remaining.startsWith(seg.text)) {
        remaining = remaining.slice(seg.text.length);
      }
    } else if (seg.type === "kanji") {
      // Look ahead: find the next hiragana segment (if any)
      let nextHiragana = null;
      for (let j = i + 1; j < segments.length; j++) {
        if (segments[j].type === "hiragana") {
          nextHiragana = segments[j].text;
          break;
        }
      }

      const isLastKanji = kanjiIdx === kanjiSegments.length - 1;

      if (nextHiragana && remaining.includes(nextHiragana)) {
        // Consume everything in the reading up to (not including) the next hiragana.
        // Start search from index 1 so the kanji always gets at least one mora
        // (fixes words like 痛い/いたい where the suffix い also starts the reading).
        const idx = remaining.indexOf(nextHiragana, 1);
        if (idx > 0) {
          alignments.push({ kanji: seg.text, reading: remaining.slice(0, idx) });
          remaining = remaining.slice(idx);
        } else {
          // idx === -1 or 0 — fall through to last-kanji handling
          let trailingSuffix = "";
          for (let j = i + 1; j < segments.length; j++) {
            if (segments[j].type === "hiragana") trailingSuffix += segments[j].text;
          }
          let kanjiReading = remaining;
          if (trailingSuffix && remaining.endsWith(trailingSuffix)) {
            kanjiReading = remaining.slice(0, remaining.length - trailingSuffix.length);
          }
          alignments.push({ kanji: seg.text, reading: kanjiReading });
          remaining = "";
        }
      } else if (isLastKanji) {
        // Last kanji: strip any trailing okurigana that appear after it
        let trailingSuffix = "";
        for (let j = i + 1; j < segments.length; j++) {
          if (segments[j].type === "hiragana") trailingSuffix += segments[j].text;
        }
        let kanjiReading = remaining;
        if (trailingSuffix && remaining.endsWith(trailingSuffix)) {
          kanjiReading = remaining.slice(0, remaining.length - trailingSuffix.length);
        }
        alignments.push({ kanji: seg.text, reading: kanjiReading });
        remaining = "";
      } else {
        // Fallback: take one mora per kanji character from what remains
        let reading = "";
        let ri = 0;
        for (let k = 0; k < seg.text.length && ri < remaining.length; k++) {
          reading += remaining[ri++];
          if (ri < remaining.length &&
              ["ゃ", "ゅ", "ょ", "っ", "ァ", "ィ", "ゥ", "ェ", "ォ"].includes(remaining[ri])) {
            reading += remaining[ri++];
          }
        }
        alignments.push({ kanji: seg.text, reading });
        remaining = remaining.slice(ri);
      }
      kanjiIdx++;
    }
  }

  return alignments;
}

/**
 * Converts Japanese text with hiragana reading into ruby-formatted JSX
 *
 * Example:
 *   renderWithFuriganaJSX("食べる", "たべる")
 *   Returns: <ruby>食<rt>た</rt></ruby>べる
 *
 * @param {string} text - The Japanese text with kanji
 * @param {string} reading - The hiragana reading
 * @returns {React.ReactElement} JSX with ruby tags
 */
export function renderWithFuriganaJSX(text, reading) {
  if (!text || !reading) {
    return text || "";
  }

  const segments = segmentJapaneseText(text);
  const alignments = alignKanjiWithReadings(segments, reading);

  let alignmentIndex = 0;
  const result = [];

  for (const segment of segments) {
    if (segment.type === "kanji" && alignmentIndex < alignments.length) {
      const { kanji, reading: furigana } = alignments[alignmentIndex];
      alignmentIndex++;
      result.push(
        <ruby key={`ruby-${result.length}`}>
          {kanji}
          <rt>{furigana}</rt>
        </ruby>
      );
    } else {
      result.push(segment.text);
    }
  }

  return result.length > 0 ? result : text;
}

/**
 * Converts Japanese text with hiragana reading into HTML ruby-formatted string
 * This is useful for rendering in contexts that don't support JSX
 *
 * Example:
 *   renderWithFuriganaHTML("食べる", "たべる")
 *   Returns: "<ruby>食<rt>た</rt></ruby>べる"
 *
 * @param {string} text - The Japanese text with kanji
 * @param {string} reading - The hiragana reading
 * @returns {string} HTML string with ruby tags
 */
export function renderWithFuriganaHTML(text, reading) {
  if (!text || !reading) {
    return text || "";
  }

  const segments = segmentJapaneseText(text);
  const alignments = alignKanjiWithReadings(segments, reading);

  let alignmentIndex = 0;
  let result = "";

  for (const segment of segments) {
    if (segment.type === "kanji" && alignmentIndex < alignments.length) {
      const { kanji, reading: furigana } = alignments[alignmentIndex];
      alignmentIndex++;
      result += `<ruby>${kanji}<rt>${furigana}</rt></ruby>`;
    } else {
      result += segment.text;
    }
  }

  return result || text;
}

/**
 * React component wrapper for displaying Japanese text with furigana
 * Handles both JSX and HTML rendering
 */
export function FuriganaText({ text, reading }) {
  if (!text || !reading) {
    return text || "";
  }

  return <span>{renderWithFuriganaJSX(text, reading)}</span>;
}

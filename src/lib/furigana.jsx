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
 * Aligns kanji with their readings
 * Returns an array of { kanji: string, reading: string }
 *
 * This is a simple alignment: assumes hiragana readings follow kanji in order.
 * For more complex cases, you may need to implement a more sophisticated algorithm.
 */
function alignKanjiWithReadings(segments, hiraganaReading) {
  const kanjiSegments = segments.filter((s) => s.type === "kanji");
  const alignments = [];
  let readingIndex = 0;

  for (const kanjiSeg of kanjiSegments) {
    let reading = "";
    const kanjiLength = kanjiSeg.text.length;

    // Try to match syllables with kanji count
    // This is a simplified approach: for each kanji, try to extract a reasonable reading
    for (let i = 0; i < kanjiLength && readingIndex < hiraganaReading.length; i++) {
      // Collect hiragana characters until we have enough (typically 2-3 per kanji)
      // This is a heuristic and may need adjustment for complex words
      const syllables = [];
      while (readingIndex < hiraganaReading.length) {
        const char = hiraganaReading[readingIndex];
        // Small hiragana characters (ゃ, ゅ, ょ) are part of the previous syllable
        const isSmall = ["ゃ", "ゅ", "ょ", "ァ", "ィ", "ゥ", "ェ", "ォ"].includes(char);
        syllables.push(char);
        readingIndex++;
        if (!isSmall || syllables.length >= 2) break;
      }
      reading += syllables.join("");
    }

    alignments.push({
      kanji: kanjiSeg.text,
      reading: reading || "",
    });
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

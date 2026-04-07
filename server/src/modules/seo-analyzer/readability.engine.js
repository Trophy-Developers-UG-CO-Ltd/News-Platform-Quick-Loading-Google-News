/**
 * Readability Analysis Engine
 * Computes readability scores using Flesch-Kincaid and custom checks.
 * @module modules/seo-analyzer/readability.engine
 */

'use strict';

// ─── Helpers ──────────────────────────────────────────────────

function stripHtml(html = '') {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function splitSentences(text) {
  // Split on sentence-ending punctuation followed by whitespace or end
  return text
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(Boolean);
}

function splitWords(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * Count syllables in an English word (heuristic).
 */
function countSyllables(word) {
  word = word.toLowerCase().trim();
  if (word.length <= 3) return 1;
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  word = word.replace(/^y/, '');
  const matches = word.match(/[aeiouy]{1,2}/g);
  return matches ? matches.length : 1;
}

// ─── Transition Words ─────────────────────────────────────────

const TRANSITION_WORDS = new Set([
  'however', 'therefore', 'furthermore', 'moreover', 'consequently',
  'additionally', 'nevertheless', 'nonetheless', 'meanwhile', 'subsequently',
  'initially', 'finally', 'first', 'second', 'third', 'also', 'besides',
  'instead', 'otherwise', 'similarly', 'likewise', 'in addition',
  'as a result', 'for example', 'for instance', 'in conclusion',
  'in summary', 'on the other hand', 'in contrast', 'because', 'although',
  'while', 'since', 'unless', 'until', 'when', 'whereas',
]);

function hasTranistionWord(sentence) {
  const lower = sentence.toLowerCase();
  for (const tw of TRANSITION_WORDS) {
    if (lower.includes(tw)) return true;
  }
  return false;
}

// ─── Passive Voice ────────────────────────────────────────────

const PASSIVE_REGEX = /\b(was|were|is|are|be|been|being)\s+\w+ed\b/i;

function hasPassiveVoice(sentence) {
  return PASSIVE_REGEX.test(sentence);
}

// ─── Flesch-Kincaid Reading Ease ──────────────────────────────

/**
 * Compute Flesch Reading Ease score (0–100, higher = easier).
 * Formula: 206.835 - 1.015*(words/sentences) - 84.6*(syllables/words)
 */
function fleschReadingEase(sentences, words) {
  if (!sentences.length || !words.length) return 0;
  const totalWords     = words.length;
  const totalSentences = sentences.length;
  const totalSyllables = words.reduce((acc, w) => acc + countSyllables(w), 0);

  const score = 206.835
    - 1.015 * (totalWords / totalSentences)
    - 84.6  * (totalSyllables / totalWords);

  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Convert Flesch score to grade description.
 */
function fleschGrade(score) {
  if (score >= 90) return 'Very Easy';
  if (score >= 80) return 'Easy';
  if (score >= 70) return 'Fairly Easy';
  if (score >= 60) return 'Standard';
  if (score >= 50) return 'Fairly Difficult';
  if (score >= 30) return 'Difficult';
  return 'Very Difficult';
}

// ─── Paragraph Structure ──────────────────────────────────────

function analyzeParagraphs(html) {
  const paras = html
    .split(/<\/p>|<br\s*\/?>/i)
    .map(p => stripHtml(p).trim())
    .filter(Boolean);

  const longParagraphs = paras.filter(p => splitSentences(p).length > 6);
  return {
    count:          paras.length,
    longParagraphs: longParagraphs.length,
  };
}

// ─── Main Readability Analyzer ────────────────────────────────

/**
 * Analyze readability of content.
 * @param {string} content - HTML or text content
 * @returns {object}       - readability analysis result
 */
function analyzeReadability(content = '') {
  const text      = stripHtml(content);
  const sentences = splitSentences(text);
  const words     = splitWords(text);

  const fleschScore = fleschReadingEase(sentences, words);
  const fleschLabel = fleschGrade(fleschScore);

  // Sentence length analysis
  const sentenceLengths  = sentences.map(s => splitWords(s).length);
  const avgSentenceLength = sentences.length
    ? Math.round(sentenceLengths.reduce((a, b) => a + b, 0) / sentences.length)
    : 0;
  const longSentences = sentenceLengths.filter(l => l > 20).length;

  // Passive voice
  const passiveCount   = sentences.filter(hasPassiveVoice).length;
  const passivePercent = sentences.length
    ? parseFloat(((passiveCount / sentences.length) * 100).toFixed(1))
    : 0;

  // Transition words
  const transitionCount   = sentences.filter(hasTranistionWord).length;
  const transitionPercent = sentences.length
    ? parseFloat(((transitionCount / sentences.length) * 100).toFixed(1))
    : 0;

  // Paragraph structure
  const paragraphs = analyzeParagraphs(content);

  // Readability sub-score (0-100):
  // Weighted combination:
  //   40% Flesch score (higher = better)
  //   20% Avg sentence length (<=20 = full marks, penalty for longer)
  //   20% Passive voice (<=10% = full, penalty for more)
  //   20% Transition words (>=30% = full, penalty for less)
  const sentenceScore   = Math.max(0, 100 - Math.max(0, avgSentenceLength - 20) * 3);
  const passiveScore    = Math.max(0, 100 - Math.max(0, passivePercent - 10) * 3);
  const transitionScore = Math.min(100, (transitionPercent / 30) * 100);
  const readabilityScore = Math.round(
    0.40 * fleschScore +
    0.20 * sentenceScore +
    0.20 * passiveScore +
    0.20 * transitionScore
  );

  const issues = [];
  if (avgSentenceLength > 20)   issues.push({ type: 'sentence_length',   message: `Average sentence length is ${avgSentenceLength} words; aim for ≤20.` });
  if (passivePercent > 10)       issues.push({ type: 'passive_voice',     message: `${passivePercent}% of sentences use passive voice; keep below 10%.` });
  if (transitionPercent < 30)    issues.push({ type: 'transitions',       message: `Only ${transitionPercent}% of sentences use transition words; aim for ≥30%.` });
  if (paragraphs.longParagraphs) issues.push({ type: 'long_paragraphs',   message: `${paragraphs.longParagraphs} paragraph(s) have more than 6 sentences; split them up.` });
  if (fleschScore < 60)          issues.push({ type: 'flesch',            message: `Flesch Reading Ease is ${fleschScore} (${fleschLabel}); aim for 60+.` });

  return {
    readabilityScore: Math.max(0, Math.min(100, readabilityScore)),
    fleschScore,
    fleschLabel,
    avgSentenceLength,
    longSentences,
    passiveVoicePercent: passivePercent,
    transitionWordPercent: transitionPercent,
    paragraphs,
    sentenceCount: sentences.length,
    wordCount: words.length,
    issues,
    grade: (() => {
      if (readabilityScore >= 80) return 'Good';
      if (readabilityScore >= 60) return 'OK';
      if (readabilityScore >= 40) return 'Needs Improvement';
      return 'Poor';
    })(),
  };
}

module.exports = { analyzeReadability, fleschReadingEase, fleschGrade };

// MukonoTalks


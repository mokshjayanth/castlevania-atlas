// Episode codes ("S2E6", "S3E2–E8", "S1") and their titles.
import { G } from './core.js';

/** "S2E6" → [2, 6]; a code without an episode sorts at the end of its season */
export const parseCode = c => {
  const m = /^S(\d)(?:E(\d+))?/.exec(c || '');
  return m ? [+m[1], m[2] ? +m[2] : 99] : null;
};

/** title for a single-episode code, '' for ranges and season-only codes */
export const epTitle = (series, code) => {
  const m = /^S(\d)E(\d+)$/.exec(code || '');
  if (!m) return '';
  const season = (G.titles[series] || {})['S' + m[1]];
  return season ? (season[+m[2] - 1] || '') : '';
};

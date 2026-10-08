/**
 * Custom preflight checks consumed by the Experience Governance tool.
 * The crawler invokes window.aem.preflight() in the page runtime and merges
 * the returned array of { alignment, id, title, reasoning, suggestions } checks.
 * alignment must be one of 'YES' (pass), 'NO' (fail) or 'NA' (not applicable).
 */

export const Alignment = Object.freeze({
  YES: 'YES',
  NO: 'NO',
  NA: 'NA',
});

/**
 * Result of a single site code check (mirrors BuiltInCheckResult in Experience
 * Governance). Uses plain own properties so consumers can read fields directly
 * and the result serializes like a plain object.
 */
export class SiteCodeCheckResult {
  /**
   * @param {object} result
   * @param {string} result.id Stable check identifier.
   * @param {string} result.title Human-readable check title.
   * @param {'YES'|'NO'|'NA'} result.alignment Check outcome.
   * @param {string} result.reasoning Explanation of the outcome.
   * @param {string} [result.suggestions] How to fix a failing check.
   */
  constructor({
    id, title, alignment, reasoning, suggestions,
  }) {
    this.id = id;
    this.title = title;
    this.alignment = alignment;
    this.reasoning = reasoning;
    if (suggestions !== undefined) this.suggestions = suggestions;
  }
}

// One that always passes.
function checkAlwaysPass() {
  return new SiteCodeCheckResult({
    id: 'always-pass',
    title: 'Example passing site code check',
    alignment: Alignment.YES,
    reasoning: 'Sentinel check confirming window.aem.preflight is wired up.',
  });
}

// One that always fails.
function checkAlwaysFail() {
  return new SiteCodeCheckResult({
    id: 'always-fail',
    title: 'Example failing site code check',
    alignment: Alignment.NO,
    reasoning: 'Sentinel check demonstrating a not-aligned result.',
    suggestions: 'Improve the content',
  });
}

// One that is never applicable.
function checkAlwaysNotApplicable() {
  return new SiteCodeCheckResult({
    id: 'always-not-applicable',
    title: 'Example not applicable site code check',
    alignment: Alignment.NA,
    reasoning: 'Sentinel check demonstrating a not-applicable result.',
  });
}

// Verify the page has exactly one H1.
function checkSingleH1() {
  const id = 'single-h1';
  const title = 'Page has exactly one H1';
  const h1s = document.querySelectorAll('main h1');
  if (h1s.length === 1) {
    return new SiteCodeCheckResult({
      id,
      title,
      alignment: Alignment.YES,
      reasoning: 'Exactly one <h1> found in main.',
    });
  }
  return new SiteCodeCheckResult({
    id,
    title,
    alignment: Alignment.NO,
    reasoning: `Found ${h1s.length} <h1> element(s) in main; expected exactly 1.`,
    suggestions: h1s.length === 0 ? 'Add a single H1 heading.' : 'Demote extra H1s to H2 or lower.',
  });
}

// Verify the rendered (decorated) page has fewer than 20 blocks.
function checkBlockCountRendered() {
  const id = 'block-count-rendered';
  const title = 'Fewer than 20 blocks on the rendered page';
  const maxBlocks = 20;

  const count = document.querySelectorAll('main .block').length;

  if (count < maxBlocks) {
    return new SiteCodeCheckResult({
      id,
      title,
      alignment: Alignment.YES,
      reasoning: `Found ${count} block(s) on the rendered page.`,
    });
  }
  return new SiteCodeCheckResult({
    id,
    title,
    alignment: Alignment.NO,
    reasoning: `Found ${count} block(s) on the rendered page; expected fewer than ${maxBlocks}.`,
    suggestions: 'Reduce the number of blocks on the page or split the content across pages.',
  });
}

// Verify the page HTML (as served, before decoration) has fewer than 20 blocks.
async function checkBlockCountMarkup() {
  const id = 'block-count-markup';
  const title = 'Fewer than 20 blocks in the page HTML';
  const maxBlocks = 20;

  let html;
  try {
    const url = new URL(window.location.href);
    url.hash = '';
    const resp = await fetch(url, { cache: 'no-store' });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    html = await resp.text();
  } catch (e) {
    return new SiteCodeCheckResult({
      id,
      title,
      alignment: Alignment.NO,
      reasoning: `Could not fetch the page HTML: ${e.message}`,
      suggestions: 'Make sure the page HTML is reachable.',
    });
  }

  const doc = new DOMParser().parseFromString(html, 'text/html');
  // In undecorated markup, blocks are classed divs directly inside section divs.
  const count = doc.querySelectorAll('main > div > div[class]').length;

  if (count < maxBlocks) {
    return new SiteCodeCheckResult({
      id,
      title,
      alignment: Alignment.YES,
      reasoning: `Found ${count} block(s) in the page HTML.`,
    });
  }
  return new SiteCodeCheckResult({
    id,
    title,
    alignment: Alignment.NO,
    reasoning: `Found ${count} block(s) in the page HTML; expected fewer than ${maxBlocks}.`,
    suggestions: 'Reduce the number of blocks on the page or split the content across pages.',
  });
}

export default function registerPreflightChecks() {
  window.aem = window.aem || {};
  window.aem.preflight = async () => [
    checkAlwaysPass(),
    checkAlwaysFail(),
    checkAlwaysNotApplicable(),
    checkSingleH1(),
    checkBlockCountRendered(),
    await checkBlockCountMarkup(),
  ];
}

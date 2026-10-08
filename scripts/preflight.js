/**
 * Custom site code checks consumed by the Experience Context
 * and driving the Experience Workspace preflight.
 * The crawler invokes window.aem.preflight() in the page runtime and merges
 * the returned array of { alignment, id, title, reasoning, suggestions } checks.
 * alignment must be one of 'YES' (pass), 'NO' (fail) or 'NA' (not applicable).
 */
export const Alignment = Object.freeze({
  YES: 'YES',
  NO: 'NO',
  NA: 'NA',
});

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
    reasoning: 'Sentinel Site Code Check demonstrating a passed result.',
  });
}

// One that always fails.
function checkAlwaysFail() {
  return new SiteCodeCheckResult({
    id: 'always-fail',
    title: 'Example failing site code check',
    alignment: Alignment.NO,
    reasoning: 'Sentinel Site Code Check demonstrating a failed result.',
    suggestions: 'Improve the content',
  });
}

// One that is never applicable.
function checkAlwaysNotApplicable() {
  return new SiteCodeCheckResult({
    id: 'always-not-applicable',
    title: 'Example not applicable site code check',
    alignment: Alignment.NA,
    reasoning: 'Sentinel Site Code Check demonstrating a not-applicable result.',
  });
}

// Verify the rendered (decorated) page has fewer than 20 blocks.
function checkBlockCountRendered() {
  const count = document.querySelectorAll('main .block').length;
  const ok = count < 20;
  return new SiteCodeCheckResult({
    id: 'block-count-rendered',
    title: 'Max 20 blocks (rendered)',
    alignment: ok ? Alignment.YES : Alignment.NO,
    reasoning: `Found ${count} block(s) on the rendered page.`,
    suggestions: ok ? undefined : 'Reduce the number of blocks on the page.',
  });
}

// Verify the page HTML (as served, before decoration) has fewer than 20 blocks.
async function checkBlockCountMarkup() {
  const id = 'block-count-markup';
  const title = 'Max 20 blocks (HTML)';

  const resp = await fetch(window.location.href).catch(() => null);
  if (!resp?.ok) {
    return new SiteCodeCheckResult({
      id,
      title,
      alignment: Alignment.NO,
      reasoning: `Could not fetch the page HTML (${resp ? `HTTP ${resp.status}` : 'network error'}).`,
      suggestions: 'Make sure the page HTML is reachable.',
    });
  }

  const doc = new DOMParser().parseFromString(await resp.text(), 'text/html');
  // In undecorated markup, blocks are classed divs directly inside section divs.
  const count = doc.querySelectorAll('main > div > div[class]').length;
  const ok = count < 20;
  return new SiteCodeCheckResult({
    id,
    title,
    alignment: ok ? Alignment.YES : Alignment.NO,
    reasoning: `Found ${count} block(s) in the page HTML.`,
    suggestions: ok ? undefined : 'Reduce the number of blocks on the page.',
  });
}

export default function registerPreflightChecks() {
  window.aem = window.aem || {};
  window.aem.preflight = async () => [
    checkAlwaysPass(),
    checkAlwaysFail(),
    checkAlwaysNotApplicable(),
    checkBlockCountRendered(),
    await checkBlockCountMarkup(),
  ];
}

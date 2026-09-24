/**
 * Custom preflight checks consumed by the Experience Governance tool.
 * The crawler invokes window.qe.preflight() in the page runtime and merges
 * the returned array of { alignment, id, title, reasoning, suggestions } checks.
 * alignment must be one of 'YES' (pass), 'NO' (fail) or 'NA' (not applicable).
 */

// One that always passes.
function checkAlwaysPass() {
  return {
    id: 'always-pass',
    title: 'Baseline preflight check',
    alignment: 'YES',
    reasoning: 'Sentinel check confirming window.qe.preflight is wired up.',
  };
}

// Verify the cards block structure — only applicable when a cards block exists.
function checkCardsStructure() {
  const id = 'cards-structure';
  const title = 'Cards block has valid structure';
  const blocks = [...document.querySelectorAll('.cards.block')];
  if (blocks.length === 0) {
    return { id, title, alignment: 'NA', reasoning: 'No cards block on the page.' };
  }
  const problems = [];
  blocks.forEach((block, bi) => {
    const uls = [...block.children].filter((el) => el.tagName === 'UL');
    if (uls.length !== 1) {
      problems.push(`cards #${bi + 1}: expected exactly one <ul>, found ${uls.length}`);
      return;
    }
    const items = [...uls[0].children];
    if (items.length === 0) problems.push(`cards #${bi + 1}: <ul> has no <li> items`);
    items.forEach((li, liI) => {
      if (li.tagName !== 'LI') {
        problems.push(`cards #${bi + 1} item ${liI + 1}: <ul> child is <${li.tagName.toLowerCase()}>, expected <li>`);
        return;
      }
      [...li.children].forEach((cell) => {
        const ok = cell.classList.contains('cards-card-image')
          || cell.classList.contains('cards-card-body');
        if (!ok) problems.push(`cards #${bi + 1} item ${liI + 1}: cell missing cards-card-image/cards-card-body class`);
      });
      const imageCell = li.querySelector('.cards-card-image');
      if (imageCell && !imageCell.querySelector('picture img')) {
        problems.push(`cards #${bi + 1} item ${liI + 1}: cards-card-image has no <picture><img>`);
      }
    });
  });
  return problems.length === 0
    ? { id, title, alignment: 'YES', reasoning: `${blocks.length} cards block(s) validated.` }
    : {
      id,
      title,
      alignment: 'NO',
      reasoning: problems.join('; '),
      suggestions: 'Ensure each card row is an <li> with cards-card-image and/or cards-card-body cells.',
    };
}

// Verify the page has exactly one H1.
function checkSingleH1() {
  const id = 'single-h1';
  const title = 'Page has exactly one H1';
  const h1s = document.querySelectorAll('main h1');
  if (h1s.length === 1) {
    return { id, title, alignment: 'YES', reasoning: 'Exactly one <h1> found in main.' };
  }
  return {
    id,
    title,
    alignment: 'NO',
    reasoning: `Found ${h1s.length} <h1> element(s) in main; expected exactly 1.`,
    suggestions: h1s.length === 0 ? 'Add a single H1 heading.' : 'Demote extra H1s to H2 or lower.',
  };
}

// Verify every image has non-empty alt text.
function checkImagesHaveAlt() {
  const id = 'images-have-alt';
  const title = 'All images have alt text';
  const imgs = [...document.querySelectorAll('main img')];
  if (imgs.length === 0) {
    return { id, title, alignment: 'NA', reasoning: 'No images on the page.' };
  }
  const missing = imgs.filter((img) => !img.getAttribute('alt') || img.getAttribute('alt').trim() === '');
  return missing.length === 0
    ? { id, title, alignment: 'YES', reasoning: `All ${imgs.length} image(s) have alt text.` }
    : {
      id,
      title,
      alignment: 'NO',
      reasoning: `${missing.length} of ${imgs.length} image(s) missing alt text: ${missing.map((img) => img.currentSrc || img.src).join(', ')}`,
      suggestions: 'Provide descriptive alt text for every image.',
    };
}

export default function registerPreflightChecks() {
  window.qe = window.qe || {};
  window.qe.preflight = () => [
    checkAlwaysPass(),
    checkCardsStructure(),
    checkSingleH1(),
    checkImagesHaveAlt(),
  ];
}

import initQuickEdit from '../quick-edit/quick-edit.js';

export default async function init(sk) {
  sk.addEventListener('custom:quick-edit', initQuickEdit);
  sk.classList.add('is-ready');
}

import { renderPageWithLayout } from '../js/layout.js';
import languageManager from '../js/language.js';

export function renderBranches() {
  const t = languageManager.t.bind(languageManager);
  
  const content = `
    <div class="branches-page">
      <div class="page-header">
        <h1>${t('branches.title')}</h1>
        <p>${t('branches.subtitle')}</p>
        <button class="btn btn-primary">
          <i data-lucide="plus"></i>
          ${t('branches.addBranch')}
        </button>
      </div>

      <div class="empty-state">
        <i data-lucide="git-branch" style="width: 64px; height: 64px; opacity: 0.3;"></i>
        <h2>${t('branches.noBranches')}</h2>
        <p>${t('branches.addFirstBranch')}</p>
      </div>
    </div>
  `;

  renderPageWithLayout(content, 'seller');
  if (window.lucide) window.lucide.createIcons();
}

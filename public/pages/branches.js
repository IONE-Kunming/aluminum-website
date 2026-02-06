import { renderPageWithLayout } from '../js/layout.js';

export function renderBranches() {
  const content = `
    <div class="branches-page">
      <div class="page-header">
        <h1>Branches</h1>
        <p>Manage your business locations</p>
        <button class="btn btn-primary">
          <i data-lucide="plus"></i>
          Add Branch
        </button>
      </div>

      <div class="empty-state">
        <i data-lucide="git-branch" style="width: 64px; height: 64px; opacity: 0.3;"></i>
        <h2>No branches yet</h2>
        <p>Add your first branch location</p>
      </div>
    </div>
  `;

  renderPageWithLayout(content, 'seller');
  if (window.lucide) window.lucide.createIcons();
}

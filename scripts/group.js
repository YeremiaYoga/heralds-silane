let parentContainer = null;

export async function initGroupTab(container) {
  parentContainer = container;
  parentContainer.style.height = "100%";
  parentContainer.style.overflow = "hidden";
  parentContainer.style.display = "flex";
  parentContainer.style.flexDirection = "column";

  renderWorkInProgress();
}

function renderWorkInProgress() {
  parentContainer.innerHTML = `
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; padding: 20px; text-align: center; background: #18181b; color: #f4f4f5;">
      <i class="fa-solid fa-people-group" style="font-size: 48px; color: #8b5cf6; margin-bottom: 16px;"></i>
      <h3 style="font-size: 18px; font-weight: 700; margin: 0 0 8px 0;">Group Panel</h3>
      <p style="color: #a1a1aa; font-size: 13px; max-width: 280px; margin: 0; line-height: 1.5;">Work in progress. This feature is currently under development.</p>
    </div>
  `;
}

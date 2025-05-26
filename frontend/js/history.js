async function fetchHistory() {
  const res = await fetch('/history');
  if (!res.ok) return [];
  const data = await res.json();
  return data.history || [];
}

function renderHistoryItem(item) {
  return `
    <div class="history-item">
      <div class="history-preview">
        <img src="${item.spriteSheetPath}" alt="${item.outputName}" />
      </div>
      <div class="history-info">
        <div class="history-filename">${item.outputName}</div>
        <div class="history-date">${new Date(item.createdAt).toLocaleString()}</div>
        <div class="history-actions">
          <a href="${item.spriteSheetPath}" download>Download PNG</a>
          <a href="${item.dataPath}" download>Download Data</a>
        </div>
      </div>
    </div>
  `;
}

async function showHistory() {
  // Only select the grid inside the visible history page
  const grid = document.querySelector('#historyPage .history-grid');
  if (!grid) return;
  grid.innerHTML = '<div>Loading...</div>';
  const history = await fetchHistory();
  if (!history.length) {
    grid.innerHTML = '<div>No history found.</div>';
    return;
  }
  grid.innerHTML = history.map(renderHistoryItem).join('');
}

// Call showHistory() when the history page is shown
window.showHistory = showHistory;
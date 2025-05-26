async function fetchHistory() {
  const res = await fetch('/history');
  if (!res.ok) return [];
  const data = await res.json();
  return data.history || [];
}

async function deleteHistoryItem(id) {
  const res = await fetch(`/history/${id}`, { method: 'DELETE' });
  return res.ok;
}

async function clearHistory() {
  const res = await fetch('/history', { method: 'DELETE' });
  return res.ok;
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
          <button class="delete-btn" data-id="${item._id}">Delete</button>
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
  grid.innerHTML = `
    <button id="clearHistoryBtn" class="cleanup-btn" style="margin-bottom:1rem;">Clear History</button>
    ${history.map(renderHistoryItem).join('')}
  `;

  // Attach delete handlers
  grid.querySelectorAll('.delete-btn').forEach(btn => {
    btn.onclick = async () => {
      if (confirm('Delete this entry?')) {
        await deleteHistoryItem(btn.dataset.id);
        showHistory();
      }
    };
  });

  // Attach clear history handler
  const clearBtn = grid.querySelector('#clearHistoryBtn');
  if (clearBtn) {
    clearBtn.onclick = async () => {
      if (confirm('Clear all history?')) {
        await clearHistory();
        showHistory();
      }
    };
  }
}

// Call showHistory() when the history page is shown
window.showHistory = showHistory;
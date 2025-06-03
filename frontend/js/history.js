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
        <img src="/files/${item.spriteSheetPath}" alt="${item.outputName}" loading="lazy" />
      </div>
      <div class="history-info">
        <div class="history-filename">${item.outputName}</div>
        <div class="history-date">
          <i class="far fa-calendar-alt"></i>
          ${new Date(item.createdAt).toLocaleString()}
        </div>
        <div class="history-actions">
          <a href="/files/${item.spriteSheetPath}" download>
            <i class="fas fa-download"></i> PNG
          </a>
          <a href="/files/${item.dataPath}" download>
            <i class="fas fa-file-code"></i> Data
          </a>
          <button class="delete-btn" data-id="${item._id}">
            <i class="fas fa-trash-alt"></i>
          </button>
        </div>
      </div>
    </div>
  `;
}

async function showHistory() {
  const grid = document.querySelector('#historyPage .history-grid');
  if (!grid) return;

  grid.innerHTML = `
    <div class="history-loading">
      <i class="fas fa-spinner fa-spin"></i>
      <p>Loading history...</p>
    </div>
  `;

  const history = await fetchHistory();
  
  if (!history.length) {
    grid.innerHTML = `
      <div class="history-empty">
        <i class="far fa-folder-open"></i>
        <p>No sprite sheets in your history yet.</p>
        <p>Generate some sprites to see them here!</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = `
    <button id="clearHistoryBtn">
      <i class="fas fa-trash-alt"></i>
      Clear All History
    </button>
    ${history.map(renderHistoryItem).join('')}
  `;

  // Attach delete handlers
  grid.querySelectorAll('.delete-btn').forEach(btn => {
    btn.onclick = async () => {
        const confirmed = await showModal(
            'Are you sure you want to delete this sprite sheet?',
            'Delete',
            'Cancel'
        );
        if (confirmed) {
            await deleteHistoryItem(btn.dataset.id);
            showHistory();
        }
    };
  });

  // Attach clear history handler
  const clearBtn = grid.querySelector('#clearHistoryBtn');
  if (clearBtn) {
    clearBtn.onclick = async () => {
        const confirmed = await showModal(
            'Are you sure you want to clear all history? This action cannot be undone.',
            'Clear All',
            'Cancel'
        );
        if (confirmed) {
            await clearHistory();
            showHistory();
        }
    };
  }
}

// Call showHistory() when the history page is shown
window.showHistory = showHistory;
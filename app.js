/**
 * app.js – Bitácora: lógica de registro e historial de entradas
 */

const STORAGE_KEY = 'bitacora_entries';

// ── DOM references ──────────────────────────────────────────────
const form       = document.getElementById('entry-form');
const titleInput = document.getElementById('entry-title');
const catSelect  = document.getElementById('entry-category');
const bodyInput  = document.getElementById('entry-body');
const logList    = document.getElementById('log-list');
const countBadge = document.getElementById('entry-count');
const filterText = document.getElementById('filter-text');
const filterCat  = document.getElementById('filter-category');

// ── Data helpers ─────────────────────────────────────────────────

function loadEntries() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveEntries(entries) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

// ── Rendering ────────────────────────────────────────────────────

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    year:   'numeric',
    month:  '2-digit',
    day:    '2-digit',
    hour:   '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function renderEntries() {
  const entries   = loadEntries();
  const textQuery = filterText.value.toLowerCase().trim();
  const catQuery  = filterCat.value;

  const filtered = entries.filter(e => {
    const matchText = !textQuery ||
      e.title.toLowerCase().includes(textQuery) ||
      e.body.toLowerCase().includes(textQuery);
    const matchCat = !catQuery || e.category === catQuery;
    return matchText && matchCat;
  });

  // Update badge with total count (unfiltered)
  countBadge.textContent = entries.length;

  logList.innerHTML = '';

  if (filtered.length === 0) {
    logList.innerHTML = `
      <div class="empty-state">
        <span>📋</span>
        ${entries.length === 0
          ? 'No hay registros todavía. ¡Agrega el primero!'
          : 'No se encontraron registros con ese filtro.'}
      </div>`;
    return;
  }

  // Newest first
  [...filtered].reverse().forEach(entry => {
    const div = document.createElement('div');
    div.className = `log-entry ${entry.category}`;
    div.dataset.id = entry.id;

    div.innerHTML = `
      <div class="log-meta">
        <span class="log-title">${escapeHtml(entry.title)}</span>
        <span class="log-category ${entry.category}">${entry.category}</span>
        <span class="log-time">${formatDate(entry.timestamp)}</span>
      </div>
      <div class="log-body">${escapeHtml(entry.body)}</div>
      <button class="btn-delete" title="Eliminar registro" aria-label="Eliminar registro">✕</button>
    `;

    div.querySelector('.btn-delete').addEventListener('click', () => deleteEntry(entry.id));
    logList.appendChild(div);
  });
}

// ── Entry operations ─────────────────────────────────────────────

function addEntry(title, category, body) {
  const entry = {
    id:        crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    title:     title.trim(),
    category:  category,
    body:      body.trim(),
    timestamp: new Date().toISOString(),
  };

  const entries = loadEntries();
  entries.push(entry);
  saveEntries(entries);
  renderEntries();
}

function deleteEntry(id) {
  const entries = loadEntries().filter(e => e.id !== id);
  saveEntries(entries);
  renderEntries();
}

// ── Security helper ──────────────────────────────────────────────

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ── Event listeners ──────────────────────────────────────────────

form.addEventListener('submit', e => {
  e.preventDefault();

  const title = titleInput.value.trim();
  const cat   = catSelect.value;
  const body  = bodyInput.value.trim();

  if (!title) {
    titleInput.focus();
    return;
  }

  addEntry(title, cat, body);

  titleInput.value = '';
  catSelect.value  = 'info';
  bodyInput.value  = '';
  titleInput.focus();
});

filterText.addEventListener('input', renderEntries);
filterCat.addEventListener('change', renderEntries);

// ── Init ─────────────────────────────────────────────────────────
renderEntries();

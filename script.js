const state = {
  allCharacters: [],
  filteredCharacters: [],
};

const grid = document.getElementById('characterGrid');
const searchInput = document.getElementById('searchInput');
const positionFilter = document.getElementById('positionFilter');
const elementFilter = document.getElementById('elementFilter');
const teamFilter = document.getElementById('teamFilter');
const resetFiltersBtn = document.getElementById('resetFilters');
const resultsCount = document.getElementById('resultsCount');
const modal = document.getElementById('characterModal');
const modalBody = document.getElementById('modalBody');
const closeModalBtn = document.getElementById('closeModal');
const themeToggle = document.getElementById('themeToggle');

const elementColors = {
  Fuego: 'linear-gradient(135deg, #ff7b00, #ff2d55)',
  Aire: 'linear-gradient(135deg, #7cf0ff, #3f51ff)',
  Bosque: 'linear-gradient(135deg, #6fe36a, #1c8f4f)',
  Montaña: 'linear-gradient(135deg, #d7b56d, #8d6e63)',
  none: 'linear-gradient(135deg, #9aa5ce, #5f6db3)',
};

async function init() {
  setupTheme();
  bindEvents();

  try {
    const response = await fetch('./data/characters.json');
    const data = await response.json();
    state.allCharacters = data.characters;
    populateFilters(state.allCharacters);
    applyFilters();
  } catch (error) {
    console.error(error);
    grid.innerHTML = '<div class="empty-state">No se pudieron cargar los personajes.</div>';
    resultsCount.textContent = 'Error al cargar';
  }
}

function bindEvents() {
  [searchInput, positionFilter, elementFilter, teamFilter].forEach((el) => {
    el.addEventListener('input', applyFilters);
    el.addEventListener('change', applyFilters);
  });

  resetFiltersBtn.addEventListener('click', () => {
    searchInput.value = '';
    positionFilter.value = 'all';
    elementFilter.value = 'all';
    teamFilter.value = 'all';
    applyFilters();
  });

  closeModalBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (event) => {
    const rect = modal.getBoundingClientRect();
    const isInside = (
      event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom
    );
    if (!isInside) closeModal();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modal.open) closeModal();
  });

  themeToggle.addEventListener('click', toggleTheme);
}

function populateFilters(characters) {
  populateSelect(positionFilter, uniqueValues(characters.flatMap((c) => c.positions)));
  populateSelect(elementFilter, uniqueValues(characters.map((c) => c.element)));
  populateSelect(teamFilter, uniqueValues(characters.flatMap((c) => c.teams)));
}

function populateSelect(select, values) {
  values.forEach((value) => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = value;
    select.appendChild(option);
  });
}

function uniqueValues(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es'));
}

function applyFilters() {
  const term = searchInput.value.trim().toLowerCase();
  const position = positionFilter.value;
  const element = elementFilter.value;
  const team = teamFilter.value;

  state.filteredCharacters = state.allCharacters.filter((character) => {
    const haystack = [
      character.name,
      character.japaneseName,
      character.description,
      character.element,
      ...character.positions,
      ...character.teams,
      ...character.techniques,
    ]
      .join(' ')
      .toLowerCase();

    const matchesTerm = !term || haystack.includes(term);
    const matchesPosition = position === 'all' || character.positions.includes(position);
    const matchesElement = element === 'all' || character.element === element;
    const matchesTeam = team === 'all' || character.teams.includes(team);

    return matchesTerm && matchesPosition && matchesElement && matchesTeam;
  });

  renderCharacters();
}

function renderCharacters() {
  resultsCount.textContent = `${state.filteredCharacters.length} personaje(s)`;

  if (!state.filteredCharacters.length) {
    grid.innerHTML = '<div class="empty-state">No hay personajes que coincidan con tu búsqueda.</div>';
    return;
  }

  grid.innerHTML = state.filteredCharacters.map(createCard).join('');
  grid.querySelectorAll('.character-card').forEach((card) => {
    card.addEventListener('click', () => {
      const id = card.dataset.id;
      const character = state.allCharacters.find((item) => item.id === id);
      openModal(character);
    });
  });
}

function createCard(character) {
  const gradient = elementColors[character.element] || elementColors.none;
  return `
    <article class="character-card" data-id="${character.id}" tabindex="0" role="button" aria-label="Ver ficha de ${character.name}">
      <div class="character-card__avatar" style="background:${gradient}">
        <span>${character.shortName}</span>
      </div>
      <div class="character-card__title">
        <div>
          <h3>${character.name}</h3>
          <p>${character.japaneseName}</p>
        </div>
        <span class="tag">${character.element}</span>
      </div>
      <div class="character-meta">
        ${character.positions.map((position) => `<span class="tag">${position}</span>`).join('')}
      </div>
      <p>${character.description}</p>
      <div class="tag-list">
        ${character.teams.slice(0, 2).map((team) => `<span class="tag">${team}</span>`).join('')}
      </div>
    </article>
  `;
}

function openModal(character) {
  if (!character) return;
  const gradient = elementColors[character.element] || elementColors.none;

  modalBody.innerHTML = `
    <div class="modal-layout">
      <div class="modal-avatar" style="background:${gradient}">${character.shortName}</div>
      <div>
        <p class="eyebrow">Player Data</p>
        <h3>${character.name}</h3>
        <p><strong>${character.japaneseName}</strong></p>
        <p>${character.longDescription}</p>

        <div class="info-list">
          <div class="info-item"><span>Posición</span>${character.positions.join(', ')}</div>
          <div class="info-item"><span>Elemento</span>${character.element}</div>
          <div class="info-item"><span>Curso</span>${character.schoolYear}</div>
          <div class="info-item"><span>Nacionalidad</span>${character.nationality}</div>
        </div>

        <div class="info-item">
          <span>Equipos</span>
          ${character.teams.join(', ')}
        </div>

        <div class="info-item" style="margin-top:12px;">
          <span>Técnicas destacadas</span>
          ${character.techniques.join(', ')}
        </div>

        <div class="info-item" style="margin-top:12px;">
          <span>Fuente</span>
          <a href="${character.source}" target="_blank" rel="noopener noreferrer">Ver ficha en la wiki</a>
        </div>
      </div>
    </div>
  `;

  modal.showModal();
}

function closeModal() {
  modal.close();
}

function setupTheme() {
  const savedTheme = localStorage.getItem('inazuma-theme');
  if (savedTheme === 'light') {
    document.body.classList.add('light');
  }
}

function toggleTheme() {
  document.body.classList.toggle('light');
  localStorage.setItem('inazuma-theme', document.body.classList.contains('light') ? 'light' : 'dark');
}

init();

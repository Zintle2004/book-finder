const API_BASE_URL = 'https://gutendex.com/books/';
const FAVORITES_STORAGE_KEY = 'book-finder-favorites';

const booksContainer = document.getElementById('books-container');
const statusMessage = document.getElementById('status-message');
const favoritesCount = document.getElementById('fav-count');
const viewFavoritesButton = document.getElementById('view-favorites-btn');
const searchInput = document.getElementById('search-input');
const topicSelect = document.getElementById('topic-select');
const searchButton = document.getElementById('search-btn');
const booksById = new Map();
const favorites = loadFavorites();
let loadedBooks = [];
let showingFavorites = false;
let searchDebounce;
let activeRequest;

function loadFavorites() {
  try {
    const savedBooks = JSON.parse(localStorage.getItem(FAVORITES_STORAGE_KEY) || '[]');
    return new Map(savedBooks.map((book) => [String(book.id), book]));
  } catch (error) {
    console.error('Could not read saved favorites:', error);
    return new Map();
  }
}

function saveFavorites() {
  try {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify([...favorites.values()]));
    return true;
  } catch (error) {
    console.error('Could not save favorites:', error);
    statusMessage.textContent = 'Favorites could not be saved in this browser.';
    statusMessage.classList.remove('hidden');
    return false;
  }
}

function updateFavoritesCount() {
  favoritesCount.textContent = favorites.size;
}

function updateFavoriteButton(button, book) {
  const isFavorite = favorites.has(String(book.id));
  button.textContent = isFavorite ? 'Remove from Favorites' : 'Add to Favorites';
  button.setAttribute('aria-pressed', String(isFavorite));
}


function renderBooks(books) {
  booksContainer.replaceChildren();
  booksById.clear();

  books.forEach((book) => {
    booksById.set(String(book.id), book);
    const card = document.createElement('div');
    card.classList.add('book-card');

    const cover = document.createElement('img');
    cover.classList.add('book-cover');
    cover.src = book.formats?.['image/jpeg'] || 'https://placehold.co/300x450?text=No+Cover';
    cover.alt = `Cover of ${book.title}`;
    cover.loading = 'lazy';

    const bookInfo = document.createElement('div');
    bookInfo.classList.add('book-info');

    const title = document.createElement('h3');
    title.classList.add('book-title');
    title.textContent = book.title;

    const author = document.createElement('p');
    author.classList.add('book-author');
    author.textContent = `by ${book.authors.map((item) => item.name).join(', ') || 'Unknown Author'}`;

    const actions = document.createElement('div');
    actions.classList.add('book-actions');

    const detailsButton = document.createElement('button');
    detailsButton.classList.add('details-btn');
    detailsButton.dataset.bookId = book.id;
    detailsButton.textContent = 'Details';

    const favoriteButton = document.createElement('button');
    favoriteButton.classList.add('favorite-btn');
    favoriteButton.dataset.bookId = book.id;
    updateFavoriteButton(favoriteButton, book);

    bookInfo.append(title, author);
    actions.append(detailsButton, favoriteButton);
    card.append(cover, bookInfo, actions);

    booksContainer.appendChild(card);
  });
}

booksContainer.addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button) return;

  const book = booksById.get(button.dataset.bookId);
  if (!book) return;

  if (button.classList.contains('details-btn')) {
    openBookModal(book);
    return;
  }

  if (button.classList.contains('favorite-btn')) {
    const bookId = String(book.id);
    if (favorites.has(bookId)) {
      favorites.delete(bookId);
    } else {
      favorites.set(bookId, book);
    }

    saveFavorites();
    updateFavoritesCount();
    if (showingFavorites) {
      renderBooks([...favorites.values()]);
      if (favorites.size === 0) {
        statusMessage.textContent = 'You have no favorite books yet.';
        statusMessage.classList.remove('hidden');
      }
    } else {
      updateFavoriteButton(button, book);
    }
  }
});

viewFavoritesButton.addEventListener('click', () => {
  showingFavorites = !showingFavorites;
  updateFavoritesViewButton();

  const booksToShow = showingFavorites ? [...favorites.values()] : loadedBooks;
  renderBooks(booksToShow);

  if (showingFavorites && favorites.size === 0) {
    statusMessage.textContent = 'You have no favorite books yet.';
    statusMessage.classList.remove('hidden');
  } else {
    statusMessage.classList.add('hidden');
  }
});

function updateFavoritesViewButton() {
  viewFavoritesButton.firstChild.textContent = showingFavorites ? 'View All Books (' : 'View Favorites (';
}

updateFavoritesCount();

function searchBooks() {
  clearTimeout(searchDebounce);
  const url = new URL(API_BASE_URL);
  const searchTerm = searchInput.value.trim();
  const topic = topicSelect.value;

  if (searchTerm) url.searchParams.set('search', searchTerm);
  if (topic) url.searchParams.set('topic', topic);

  showingFavorites = false;
  updateFavoritesViewButton();
  fetchData(url);
}

searchButton.addEventListener('click', searchBooks);
searchInput.addEventListener('input', () => {
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(searchBooks, 350);
});
searchInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') searchBooks();
});
topicSelect.addEventListener('change', searchBooks);

function fetchData(url) {
  activeRequest?.abort();
  activeRequest = new AbortController();

  statusMessage.textContent = 'Loading books...';
  statusMessage.classList.remove('hidden');

  fetch(url, { signal: activeRequest.signal })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      loadedBooks = data.results;
      renderBooks(showingFavorites ? [...favorites.values()] : loadedBooks);
      if (showingFavorites && favorites.size === 0) {
        statusMessage.textContent = 'You have no favorite books yet.';
        statusMessage.classList.remove('hidden');
      } else if (!showingFavorites && data.results.length === 0) {
        statusMessage.textContent = 'No books found. Try another search or topic.';
        statusMessage.classList.remove('hidden');
      } else {
        statusMessage.classList.add('hidden');
      }
    })
    .catch((error) => {
      if (error.name === 'AbortError') return;
      statusMessage.textContent = 'Could not load books. Please try again later.';
      console.error('Could not fetch books:', error);
    });
}


fetchData(API_BASE_URL);
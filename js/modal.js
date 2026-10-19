const modal = document.getElementById('book-modal');
const modalBody = document.getElementById('modal-body');
const closeModalBtn = document.getElementById('close-modal');

function openBookModal(book) {
  modalBody.replaceChildren();

  const title = document.createElement('h2');
  title.id = 'modal-title';
  title.textContent = book.title;
  modalBody.append(title);

  const authors = book.authors.map((author) => {
    const years = [author.birth_year, author.death_year].map((year) => year ?? '?').join(' - ');
    return `${author.name} (${years})`;
  });
  addDetail('Author(s)', authors.join(', ') || 'Unknown');
  addDetail('Subjects', book.subjects.join(', ') || 'None listed');
  addDetail('Bookshelves', book.bookshelves.join(', ') || 'None listed');
  addDetail('Languages', book.languages.map((language) => language.toUpperCase()).join(', ') || 'Unknown');
  addDetail('Media type', book.media_type || 'Unknown');
  addDetail('Copyright', book.copyright == null ? 'Unknown' : (book.copyright ? 'Yes' : 'No'));
  addDetail('Downloads', Number(book.download_count || 0).toLocaleString());

  const readingFormats = [
    ['Read online', 'text/html'],
    ['Download EPUB', 'application/epub+zip'],
    ['Download plain text', 'text/plain; charset=utf-8'],
  ];
  readingFormats.forEach(([label, format]) => {
    const url = book.formats?.[format];
    if (!url) return;

    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = label;
    modalBody.append(link);
  });

  modal.classList.remove('hidden');
  closeModalBtn.focus();
}

function addDetail(label, value) {
  const paragraph = document.createElement('p');
  const strong = document.createElement('strong');
  strong.textContent = `${label}: `;
  paragraph.append(strong, document.createTextNode(value));
  modalBody.append(paragraph);
}

closeModalBtn.addEventListener('click', () => {
  modal.classList.add('hidden');
});

// Close modal when clicking outside content box
window.addEventListener('click', (e) => {
  if (e.target === modal) {
    modal.classList.add('hidden');
  }
});

window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !modal.classList.contains('hidden')) {
    modal.classList.add('hidden');
  }
});
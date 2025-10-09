/* ======== Freedom Prayer System eBook Logic ======== */

// Select important elements
const landing = document.querySelector('.landing-page');
const reader = document.getElementById('reader');
const startBtn = document.getElementById('startReading');
const chaptersList = document.getElementById('chapters');
const contentContainer = document.getElementById('chapter-content');
const progressBar = document.getElementById('progressBar');
const themeToggle = document.getElementById('themeToggle');
const audioBtn = document.getElementById('audioBtn');

let chapters = [];
let currentChapter = 0;

/* ========== Initialize ========== */
startBtn.addEventListener('click', () => {
  landing.classList.add('hidden');
  reader.classList.remove('hidden');
  loadChapters();
  loadTheme();
});

/* ========== Load Chapters ========== */
async function loadChapters() {
  try {
    const response = await fetch('chapters.json');
    chapters = await response.json();
    renderTOC();
    const savedProgress = localStorage.getItem('ebook-progress');
    if (savedProgress) {
      loadChapter(parseInt(savedProgress));
    } else {
      loadChapter(0);
    }
  } catch (err) {
    contentContainer.innerHTML = `<p style="color:red">Error loading chapters.json. Ensure it is in the same folder.</p>`;
  }
}

/* ========== Render Table of Contents ========== */
function renderTOC() {
  chaptersList.innerHTML = '';
  chapters.forEach((chapter, index) => {
    const div = document.createElement('div');
    div.textContent = chapter.title;
    div.classList.add('chapter');
    div.onclick = () => loadChapter(index);
    chaptersList.appendChild(div);
  });
}

/* ========== Load Selected Chapter ========== */
async function loadChapter(index) {
  if (!chapters[index]) return;

  try {
    const res = await fetch(chapters[index].file);
    const text = await res.text();

    currentChapter = index;
    document.querySelectorAll('.chapter').forEach((el, i) => {
      el.classList.toggle('active', i === index);
    });

    contentContainer.innerHTML = marked.parse(text);
    updateProgress();
    saveProgress();
  } catch (err) {
    contentContainer.innerHTML = `<p style="color:red">Error loading ${chapters[index].file}</p>`;
  }
}

/* ========== Progress Tracker ========== */
function updateProgress() {
  const progress = ((currentChapter + 1) / chapters.length) * 100;
  progressBar.style.width = progress + '%';
}

function saveProgress() {
  localStorage.setItem('ebook-progress', currentChapter);
}

/* ========== Theme (Dark/Light Mode) ========== */
themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark');
  const isDark = document.body.classList.contains('dark');
  localStorage.setItem('theme', isDark);
});

function loadTheme() {
  const dark = localStorage.getItem('theme') === 'true';
  if (dark) document.body.classList.add('dark');
}

/* ========== Text-to-Speech ========== */
audioBtn.addEventListener('click', () => {
  const synth = window.speechSynthesis;
  const text = contentContainer.innerText;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1;
  utterance.pitch = 1;
  synth.speak(utterance);
});

/* ========== Service Worker for Offline Use ========== */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('./service-worker.js')
      .then(() => console.log('✅ Service Worker Registered - Offline ready'))
      .catch((err) => console.error('❌ Service Worker registration failed:', err));
  });
}

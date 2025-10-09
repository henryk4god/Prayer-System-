// ======== App Logic ========

// Start reading button
document.getElementById("startReading").addEventListener("click", () => {
  document.querySelector(".landing-page").classList.add("hidden");
  document.getElementById("reader").classList.remove("hidden");
});

// Fetch chapters list
fetch("chapters.json")
  .then(res => res.json())
  .then(chapters => {
    const chaptersContainer = document.getElementById("chapters");
    chapters.forEach((chapter, index) => {
      const div = document.createElement("div");
      div.classList.add("chapter");
      div.textContent = chapter.title;
      div.addEventListener("click", () => loadChapter(chapter, div, index));
      chaptersContainer.appendChild(div);
    });
  });

// Load chapter content
function loadChapter(chapter, element, index) {
  document.querySelectorAll(".chapter").forEach(c => c.classList.remove("active"));
  element.classList.add("active");

  fetch(chapter.file)
    .then(res => res.text())
    .then(text => {
      document.getElementById("chapter-content").innerHTML = marked.parse(text);
      updateProgress(index + 1);
    });

  // Close sidebar automatically on mobile
  if (window.innerWidth <= 768) {
    sidebar.classList.remove("open");
  }
}

// Progress bar
function updateProgress(chapterNumber) {
  const total = document.querySelectorAll(".chapter").length;
  const progress = (chapterNumber / total) * 100;
  document.getElementById("progressBar").style.width = progress + "%";
}

// Theme toggle
document.getElementById("themeToggle").addEventListener("click", () => {
  document.body.classList.toggle("dark");
});

// Text-to-speech
document.getElementById("audioBtn").addEventListener("click", () => {
  const content = document.getElementById("chapter-content").innerText;
  const speech = new SpeechSynthesisUtterance(content);
  speech.lang = "en-US";
  window.speechSynthesis.speak(speech);
});

// ======== Mobile Sidebar Toggle ========
const toggleSidebar = document.getElementById('toggleSidebar');
const sidebar = document.getElementById('sidebar');

toggleSidebar.addEventListener('click', () => {
  sidebar.classList.toggle('open');
});

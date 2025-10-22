class EBookReader {
    constructor() {
        this.currentChapter = 1;
        this.totalChapters = 8;
        this.theme = localStorage.getItem('theme') || 'light';
        this.audioEnabled = false;
        this.synth = window.speechSynthesis;
        this.utterance = null;
        this.isPlaying = false;
        this.chapters = [];
        
        this.initializeApp();
    }

    async initializeApp() {
        // Show loading screen
        this.showLoading();
        
        // Initialize theme
        this.applyTheme(this.theme);
        
        try {
            // Load chapters list first
            await this.loadChaptersList();
            // Then load the current chapter
            await this.loadChapter(this.currentChapter);
        } catch (error) {
            console.error('Error initializing app:', error);
            this.hideLoading();
        }
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Hide loading screen
        this.hideLoading();
    }

    showLoading() {
        document.getElementById('loading').classList.remove('hidden');
    }

    hideLoading() {
        document.getElementById('loading').classList.add('hidden');
    }

    applyTheme(theme) {
        this.theme = theme;
        document.body.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        
        const themeToggle = document.getElementById('themeToggle');
        themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
    }

    async loadChaptersList() {
        try {
            // First try to load from chapters.json
            const response = await fetch('./chapters.json');
            if (!response.ok) throw new Error('chapters.json not found');
            
            this.chapters = await response.json();
            this.totalChapters = this.chapters.length;
            
        } catch (error) {
            console.error('Error loading chapters.json:', error);
            // Fallback to hardcoded chapters
            this.chapters = [
                { title: "Why Traditional Prayer Methods Fail—and What to Do About It", file: "./content/chapter1.md" },
                { title: "The 5-Method Prayer System", file: "./content/chapter2.md" },
                { title: "Implementation & Optimization — Building Your Prayer Lifestyle", file: "./content/chapter3.md" },
                { title: "50 Go-To Scriptures & Weekly Reflection Prompts", file: "./content/chapter4.md" },
                { title: "Gratitude & Intercession Prayer Guide", file: "./content/chapter5.md" },
                { title: "Personal Growth & Family Prayer Strategy", file: "./content/chapter6.md" },
                { title: "Workplace, Crisis & Celebration Prayer Strategies", file: "./content/chapter7.md" },
                { title: "CONCLUSION: Your Prayer Life Reimagined", file: "./content/chapter8.md" }
            ];
        }
        
        // Populate table of contents
        this.populateTOC();
    }

    populateTOC() {
        const tocContainer = document.getElementById('toc');
        tocContainer.innerHTML = '';

        this.chapters.forEach((chapter, index) => {
            const tocItem = document.createElement('div');
            tocItem.className = 'toc-item';
            tocItem.textContent = `Chapter ${index + 1}: ${chapter.title}`;
            tocItem.addEventListener('click', () => {
                this.loadChapter(index + 1);
                this.toggleSidebar();
            });
            tocContainer.appendChild(tocItem);
        });
    }

    async loadChapter(chapterNumber) {
        if (chapterNumber < 1) chapterNumber = 1;
        if (chapterNumber > this.chapters.length) chapterNumber = this.chapters.length;
        
        this.currentChapter = chapterNumber;
        localStorage.setItem('currentChapter', chapterNumber);
        
        const chapter = this.chapters[chapterNumber - 1];
        if (!chapter) return;
        
        try {
            const response = await fetch(chapter.file);
            if (!response.ok) throw new Error('Chapter file not found');
            
            const markdownContent = await response.text();
            const htmlContent = marked.parse(markdownContent);
            document.getElementById('content').innerHTML = htmlContent;
            
        } catch (error) {
            console.error(`Error loading chapter ${chapterNumber}:`, error);
            document.getElementById('content').innerHTML = `
                <h1>Chapter ${chapterNumber}: ${chapter.title}</h1>
                <p>Error loading content. Please check if the file exists: <strong>${chapter.file}</strong></p>
            `;
        }
        
        document.getElementById('chapterTitle').textContent = `Chapter ${chapterNumber}`;
        
        // Update navigation buttons
        document.getElementById('prevChapter').disabled = chapterNumber === 1;
        document.getElementById('nextChapter').disabled = chapterNumber === this.chapters.length;
        
        // Update TOC active state
        this.updateTocActiveState();
        
        // Update progress
        this.updateProgress();
        
        // Load notes for this chapter
        this.loadNotes();
    }

    updateTocActiveState() {
        const tocItems = document.querySelectorAll('.toc-item');
        tocItems.forEach((item, index) => {
            if (index + 1 === this.currentChapter) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    updateProgress() {
        const progress = ((this.currentChapter - 1) / (this.chapters.length - 1)) * 100;
        document.getElementById('progressFill').style.width = `${progress}%`;
        document.getElementById('progressPercent').textContent = `${Math.round(progress)}%`;
        
        const circle = document.getElementById('progressRing');
        const radius = 25;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (progress / 100) * circumference;
        circle.style.strokeDasharray = `${circumference} ${circumference}`;
        circle.style.strokeDashoffset = offset;
    }

    setupEventListeners() {
        // Start reading button
        document.getElementById('startReading').addEventListener('click', () => {
            document.getElementById('landing').classList.add('hidden');
            document.getElementById('reader').classList.remove('hidden');
        });

        // Navigation buttons
        document.getElementById('prevChapter').addEventListener('click', () => {
            this.loadChapter(this.currentChapter - 1);
        });

        document.getElementById('nextChapter').addEventListener('click', () => {
            this.loadChapter(this.currentChapter + 1);
        });

        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => {
            const newTheme = this.theme === 'light' ? 'dark' : 'light';
            this.applyTheme(newTheme);
        });

        // Sidebar toggle
        document.getElementById('sidebarToggle').addEventListener('click', () => {
            this.toggleSidebar();
        });

        document.getElementById('closeSidebar').addEventListener('click', () => {
            this.toggleSidebar();
        });

        // Audio controls
        document.getElementById('audioToggle').addEventListener('click', () => {
            this.toggleAudioControls();
        });

        document.getElementById('closeAudio').addEventListener('click', () => {
            this.toggleAudioControls();
        });

        // Audio functionality
        this.setupAudio();

        // Notes functionality
        this.setupNotes();

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') {
                this.loadChapter(this.currentChapter - 1);
            } else if (e.key === 'ArrowRight') {
                this.loadChapter(this.currentChapter + 1);
            } else if (e.key === 'Escape') {
                this.closeModals();
            }
        });

        // Touch gestures for mobile
        this.setupTouchGestures();
    }

    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('overlay');
        
        sidebar.classList.toggle('open');
        overlay.classList.toggle('hidden');
        
        // Auto-close sidebar on mobile when clicking overlay
        if (window.innerWidth <= 768) {
            overlay.addEventListener('click', () => {
                sidebar.classList.remove('open');
                overlay.classList.add('hidden');
            });
        }
    }

    toggleAudioControls() {
        const audioControls = document.getElementById('audioControls');
        audioControls.classList.toggle('hidden');
    }

    setupAudio() {
        const playPauseBtn = document.getElementById('playPause');
        const stopBtn = document.getElementById('stopAudio');

        playPauseBtn.addEventListener('click', () => {
            if (this.isPlaying) {
                this.pauseAudio();
                playPauseBtn.textContent = 'Play';
            } else {
                this.playAudio();
                playPauseBtn.textContent = 'Pause';
            }
        });

        stopBtn.addEventListener('click', () => {
            this.stopAudio();
            playPauseBtn.textContent = 'Play';
        });

        // Simple audio - remove voice selection for Telegram compatibility
        document.getElementById('audioToggle').addEventListener('click', () => {
            const content = document.getElementById('content').textContent;
            const speech = new SpeechSynthesisUtterance(content);
            speech.lang = "en-US";
            window.speechSynthesis.speak(speech);
        });
    }

    playAudio() {
        if (this.isPlaying) {
            speechSynthesis.resume();
            return;
        }

        const content = document.getElementById('content').textContent;
        this.utterance = new SpeechSynthesisUtterance(content);
        this.utterance.lang = "en-US";
        this.utterance.onend = () => {
            this.isPlaying = false;
            document.getElementById('playPause').textContent = 'Play';
        };

        speechSynthesis.speak(this.utterance);
        this.isPlaying = true;
    }

    pauseAudio() {
        speechSynthesis.pause();
        this.isPlaying = false;
    }

    stopAudio() {
        speechSynthesis.cancel();
        this.isPlaying = false;
    }

    setupNotes() {
        const notesBtn = document.createElement('button');
        notesBtn.className = 'btn-secondary';
        notesBtn.textContent = 'Add Notes';
        notesBtn.style.marginTop = '2rem';
        notesBtn.addEventListener('click', () => {
            this.openNotesModal();
        });

        document.querySelector('.navigation').parentNode.insertBefore(
            notesBtn, 
            document.querySelector('.navigation')
        );

        // Notes modal events
        document.getElementById('closeNotes').addEventListener('click', () => {
            this.closeNotesModal();
        });

        document.getElementById('saveNotes').addEventListener('click', () => {
            this.saveNotes();
        });

        document.getElementById('clearNotes').addEventListener('click', () => {
            this.clearNotes();
        });
    }

    openNotesModal() {
        document.getElementById('notesModal').classList.remove('hidden');
    }

    closeNotesModal() {
        document.getElementById('notesModal').classList.add('hidden');
    }

    loadNotes() {
        const notes = localStorage.getItem(`chapter_${this.currentChapter}_notes`);
        document.getElementById('notesText').value = notes || '';
    }

    saveNotes() {
        const notes = document.getElementById('notesText').value;
        localStorage.setItem(`chapter_${this.currentChapter}_notes`, notes);
        this.closeNotesModal();
    }

    clearNotes() {
        if (confirm('Are you sure you want to clear your notes for this chapter?')) {
            document.getElementById('notesText').value = '';
            localStorage.removeItem(`chapter_${this.currentChapter}_notes`);
        }
    }

    setupTouchGestures() {
        let touchStartX = 0;
        let touchEndX = 0;

        document.addEventListener('touchstart', e => {
            touchStartX = e.changedTouches[0].screenX;
        });

        document.addEventListener('touchend', e => {
            touchEndX = e.changedTouches[0].screenX;
            this.handleSwipe(touchStartX, touchEndX);
        });
    }

    handleSwipe(startX, endX) {
        const swipeThreshold = 50;
        const diff = startX - endX;

        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0) {
                this.loadChapter(this.currentChapter + 1);
            } else {
                this.loadChapter(this.currentChapter - 1);
            }
        }
    }

    closeModals() {
        this.closeNotesModal();
        document.getElementById('audioControls').classList.add('hidden');
        
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('overlay');
        sidebar.classList.remove('open');
        overlay.classList.add('hidden');
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new EBookReader();
});

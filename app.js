class EBookReader {
    constructor() {
        this.currentChapter = 1;
        this.totalChapters = 8;
        this.chapters = {};
        this.theme = localStorage.getItem('theme') || 'light';
        this.audioEnabled = false;
        this.synth = window.speechSynthesis;
        this.utterance = null;
        this.isPlaying = false;
        
        this.initializeApp();
    }

    async initializeApp() {
        // Show loading screen
        this.showLoading();
        
        // Initialize theme
        this.applyTheme(this.theme);
        
        // Load table of contents and chapters
        await this.loadTableOfContents();
        await this.loadChapters();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Hide loading screen
        this.hideLoading();
        
        // Update progress
        this.updateProgress();
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
        
        // Update theme toggle button
        const themeToggle = document.getElementById('themeToggle');
        themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
    }

    async loadTableOfContents() {
        try {
            const response = await fetch('./content/toc.md');
            const tocContent = await response.text();
            const tocItems = this.parseTOC(tocContent);
            
            const tocContainer = document.getElementById('toc');
            tocContainer.innerHTML = '';

            tocItems.forEach((item, index) => {
                const tocItem = document.createElement('div');
                tocItem.className = 'toc-item';
                tocItem.textContent = item.title;
                tocItem.addEventListener('click', () => {
                    this.loadChapter(index + 1);
                    this.toggleSidebar();
                });
                tocContainer.appendChild(tocItem);
            });
        } catch (error) {
            console.error('Error loading table of contents:', error);
            this.fallbackTOC();
        }
    }

    parseTOC(tocContent) {
        const lines = tocContent.split('\n').filter(line => line.trim());
        const tocItems = [];
        
        lines.forEach(line => {
            // Remove markdown numbering and parse titles
            const title = line.replace(/^\d+\.\s*/, '').trim();
            if (title && !title.startsWith('#')) {
                tocItems.push({ title });
            }
        });
        
        return tocItems;
    }

    fallbackTOC() {
        const fallbackTOC = [
            { title: "Why Traditional Prayer Methods Fail—and What to Do About It" },
            { title: "The 5-Method Prayer System" },
            { title: "Implementation & Optimization — Building Your Prayer Lifestyle" },
            { title: "50 Go-To Scriptures & Weekly Reflection Prompts" },
            { title: "Gratitude & Intercession Prayer Guide" },
            { title: "Personal Growth & Family Prayer Strategy" },
            { title: "Workplace, Crisis & Celebration Prayer Strategies" },
            { title: "CONCLUSION: Your Prayer Life Reimagined" }
        ];

        const tocContainer = document.getElementById('toc');
        tocContainer.innerHTML = '';

        fallbackTOC.forEach((item, index) => {
            const tocItem = document.createElement('div');
            tocItem.className = 'toc-item';
            tocItem.textContent = `Chapter ${index + 1}: ${item.title}`;
            tocItem.addEventListener('click', () => {
                this.loadChapter(index + 1);
                this.toggleSidebar();
            });
            tocContainer.appendChild(tocItem);
        });
    }

    async loadChapters() {
        // Save reading position
        const savedChapter = localStorage.getItem('currentChapter');
        if (savedChapter) {
            this.currentChapter = parseInt(savedChapter);
        }
        
        // Preload first chapter
        await this.loadChapter(this.currentChapter);
    }

    async loadChapter(chapterNumber) {
        if (chapterNumber < 1) chapterNumber = 1;
        if (chapterNumber > this.totalChapters) chapterNumber = this.totalChapters;
        
        this.currentChapter = chapterNumber;
        localStorage.setItem('currentChapter', chapterNumber);
        
        try {
            // Try to load from markdown file
            const response = await fetch(`./content/chapter${chapterNumber}.md`);
            if (!response.ok) throw new Error('Chapter not found');
            
            const markdownContent = await response.text();
            const htmlContent = marked.parse(markdownContent);
            document.getElementById('content').innerHTML = htmlContent;
            
        } catch (error) {
            console.error(`Error loading chapter ${chapterNumber}:`, error);
            // Fallback to embedded content
            await this.loadFallbackChapter(chapterNumber);
        }
        
        document.getElementById('chapterTitle').textContent = `Chapter ${chapterNumber}`;
        
        // Update navigation buttons
        document.getElementById('prevChapter').disabled = chapterNumber === 1;
        document.getElementById('nextChapter').disabled = chapterNumber === this.totalChapters;
        
        // Update TOC active state
        this.updateTocActiveState();
        
        // Update progress
        this.updateProgress();
        
        // Load notes for this chapter
        this.loadNotes();
    }

    async loadFallbackChapter(chapterNumber) {
        // Fallback content if markdown files aren't available
        const fallbackChapters = {
            1: `# CHAPTER ONE: Why Traditional Prayer Methods Fail—and What to Do About It\n\n[Content would be loaded from chapter1.md]`,
            2: `# CHAPTER TWO: The 5-Method Prayer System\n\n[Content would be loaded from chapter2.md]`,
            3: `# CHAPTER THREE: Implementation & Optimization\n\n[Content would be loaded from chapter3.md]`,
            4: `# CHAPTER FOUR: 50 Go-To Scriptures\n\n[Content would be loaded from chapter4.md]`,
            5: `# CHAPTER FIVE: Gratitude & Intercession\n\n[Content would be loaded from chapter5.md]`,
            6: `# CHAPTER SIX: Personal Growth & Family Prayer\n\n[Content would be loaded from chapter6.md]`,
            7: `# CHAPTER SEVEN: Workplace, Crisis & Celebration\n\n[Content would be loaded from chapter7.md]`,
            8: `# CHAPTER EIGHT: CONCLUSION, Your Prayer Life Reimagined\n\n[Content would be loaded from chapter8.md]`
        };
        
        const htmlContent = marked.parse(fallbackChapters[chapterNumber] || 'Chapter content not available.');
        document.getElementById('content').innerHTML = htmlContent;
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
        const progress = ((this.currentChapter - 1) / (this.totalChapters - 1)) * 100;
        document.getElementById('progressFill').style.width = `${progress}%`;
        document.getElementById('progressPercent').textContent = `${Math.round(progress)}%`;
        
        // Update circular progress
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
        
        // Close overlay when clicked
        overlay.addEventListener('click', () => {
            sidebar.classList.remove('open');
            overlay.classList.add('hidden');
        });
    }

    toggleAudioControls() {
        const audioControls = document.getElementById('audioControls');
        audioControls.classList.toggle('hidden');
    }

    setupAudio() {
        const playPauseBtn = document.getElementById('playPause');
        const stopBtn = document.getElementById('stopAudio');
        const voiceSelect = document.getElementById('voiceSelect');
        const rateSelect = document.getElementById('rateSelect');

        // Load available voices
        this.loadVoices();

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

        // Refresh voices when they become available
        speechSynthesis.addEventListener('voiceschanged', () => {
            this.loadVoices();
        });
    }

    loadVoices() {
        const voices = speechSynthesis.getVoices();
        const voiceSelect = document.getElementById('voiceSelect');
        voiceSelect.innerHTML = '';

        voices.forEach(voice => {
            const option = document.createElement('option');
            option.value = voice.name;
            option.textContent = `${voice.name} (${voice.lang})`;
            voiceSelect.appendChild(option);
        });
    }

    playAudio() {
        if (this.isPlaying) {
            speechSynthesis.resume();
            return;
        }

        const content = document.getElementById('content').textContent;
        const selectedVoice = document.getElementById('voiceSelect').value;
        const rate = parseFloat(document.getElementById('rateSelect').value);

        this.utterance = new SpeechSynthesisUtterance(content);
        
        const voices = speechSynthesis.getVoices();
        const voice = voices.find(v => v.name === selectedVoice);
        if (voice) {
            this.utterance.voice = voice;
        }
        
        this.utterance.rate = rate;
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
                // Swipe left - next chapter
                this.loadChapter(this.currentChapter + 1);
            } else {
                // Swipe right - previous chapter
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

// Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}

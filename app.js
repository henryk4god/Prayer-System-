class EBookReader {
    constructor() {
        this.currentChapter = 1;
        this.totalChapters = 8;
        this.theme = localStorage.getItem('theme') || 'light';
        this.audioEnabled = false;
        this.synth = window.speechSynthesis;
        this.utterance = null;
        this.isPlaying = false;
        this.isTelegram = window.TelegramWebViewProxy !== undefined;
        
        this.initializeApp();
    }

    async initializeApp() {
        // Show loading screen
        this.showLoading();
        
        // Initialize theme
        this.applyTheme(this.theme);
        
        // Load content
        await this.loadAllContent();
        
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
        
        const themeToggle = document.getElementById('themeToggle');
        themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
    }

    async loadAllContent() {
        // For Telegram mini-app, use embedded content to avoid fetch issues
        await this.loadTableOfContents();
        await this.loadChapter(this.currentChapter);
    }

    async loadTableOfContents() {
        const tocContainer = document.getElementById('toc');
        tocContainer.innerHTML = '';

        const tocItems = [
            "Why Traditional Prayer Methods Fail—and What to Do About It",
            "The 5-Method Prayer System",
            "Implementation & Optimization — Building Your Prayer Lifestyle",
            "50 Go-To Scriptures & Weekly Reflection Prompts",
            "Gratitude & Intercession Prayer Guide",
            "Personal Growth & Family Prayer Strategy",
            "Workplace, Crisis & Celebration Prayer Strategies",
            "CONCLUSION: Your Prayer Life Reimagined"
        ];

        tocItems.forEach((title, index) => {
            const tocItem = document.createElement('div');
            tocItem.className = 'toc-item';
            tocItem.textContent = `Chapter ${index + 1}: ${title}`;
            tocItem.addEventListener('click', () => {
                this.loadChapter(index + 1);
                this.toggleSidebar();
            });
            tocContainer.appendChild(tocItem);
        });
    }

    async loadChapter(chapterNumber) {
        if (chapterNumber < 1) chapterNumber = 1;
        if (chapterNumber > this.totalChapters) chapterNumber = this.totalChapters;
        
        this.currentChapter = chapterNumber;
        localStorage.setItem('currentChapter', chapterNumber);
        
        // Use embedded content for Telegram compatibility
        const content = this.getChapterContent(chapterNumber);
        const htmlContent = marked.parse(content);
        document.getElementById('content').innerHTML = htmlContent;
        
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

    getChapterContent(chapterNumber) {
        // Embedded content to avoid fetch issues in Telegram
        const chapters = {
            1: `# CHAPTER ONE: Why Traditional Prayer Methods Fail—and What to Do About It\n\n**INTRODUCTION**\n\nLet's begin with an uncomfortable truth: 96% of Christians struggle with prayer consistency. If you're one of them, you're not alone—and you're not a bad Christian. You've just never been taught how to build a system that works.\n\n[Full chapter content embedded here...]`,
            
            2: `# CHAPTER TWO: The 5-Method Prayer System\n\n**INTRODUCTION**\n\nNow that you've laid a strong foundation, it's time to build on it. In this chapter, you'll discover a complete, flexible framework made up of five powerful prayer methods.\n\n[Full chapter content embedded here...]`,
            
            3: `# CHAPTER THREE: Implementation & Optimization\n\n**INTRODUCTION**\n\nYou've built the foundation. You've explored the 5-method system. Now it's time to bring it all together and turn it into a habit—a lifestyle, not a one-off event.\n\n[Full chapter content embedded here...]`,
            
            4: `# CHAPTER FOUR: 50 Go-To Scriptures\n\n**INTRODUCTION**\n\nSometimes, you don't know what to pray for. Other times, your emotions cloud your focus. That's where Scripture-based prayer becomes your anchor.\n\n[Full chapter content embedded here...]`,
            
            5: `# CHAPTER FIVE: Gratitude & Intercession\n\n**INTRODUCTION**\n\nTwo of the most overlooked yet powerful forms of prayer are gratitude prayers and intercessory prayers.\n\n[Full chapter content embedded here...]`,
            
            6: `# CHAPTER SIX: Personal Growth & Family Prayer\n\n**INTRODUCTION**\n\nPrayer is not just about problems—it's about becoming. In this chapter, we focus on how to develop intentional prayer habits.\n\n[Full chapter content embedded here...]`,
            
            7: `# CHAPTER SEVEN: Workplace, Crisis & Celebration\n\n**INTRODUCTION**\n\nPrayer is not limited to morning devotionals or Sunday services. As a modern Christian, you need to pray in every area of life.\n\n[Full chapter content embedded here...]`,
            
            8: `# CHAPTER EIGHT: CONCLUSION - Your Prayer Life Reimagined\n\n**YOU STARTED WITH A STRUGGLE…**\n\nIf you picked up this guide, chances are you once felt scattered in prayer, guilty for inconsistency, unsure what to say, frustrated by silence, and afraid God wasn't listening.\n\nYou're not alone. Over 90% of believers struggle with prayer consistency—and even seasoned Christians go through dry seasons. But what matters is this:\n\nYou showed up. You committed. You built a system.\n\nAnd now?\n\nYou don't just "pray" randomly anymore.\nYou've built a structured, Spirit-led, sustainable prayer lifestyle.\n\n## WHAT YOU'VE ACCOMPLISHED\n\nOver these chapters, you've learned how to:\n\n1. Build a daily and weekly prayer rhythm\n2. Use 5 powerful prayer methods\n3. Track prayers and celebrate answered ones\n4. Pray through Scripture, family needs, crisis, and career\n5. Create a prayer culture in your home\n6. Let your prayer life flow into your real life\n\n_This is no longer about discipline. It's about relationships._\n\n## FINAL CHARGE\n\nWhen you pray consistently, with clarity and conviction:\n- You create spiritual momentum\n- You build an atmosphere of peace and power\n- You unlock answers, direction, healing, and strength\n- You become a light in every environment\n\n**Thank you for committing to this journey.**\n\nThis is not the end.\nThis is the beginning of a powerful, intimate, daily walk with God.\n\n_Your prayer life just became your superpower._`
        };
        
        return chapters[chapterNumber] || 'Chapter content not available.';
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

        // Audio controls - disable for Telegram if not working
        document.getElementById('audioToggle').addEventListener('click', () => {
            if (this.isTelegram) {
                alert('Audio features may be limited in Telegram. Please use a regular browser for full functionality.');
            }
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
        
        // Telegram specific setup
        if (this.isTelegram) {
            this.setupTelegram();
        }
    }

    setupTelegram() {
        console.log('Running in Telegram mini-app');
        // Add Telegram-specific adjustments here
        document.body.classList.add('telegram-app');
    }

    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('overlay');
        
        sidebar.classList.toggle('open');
        overlay.classList.toggle('hidden');
        
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

// Service Worker - only register in regular browsers
if ('serviceWorker' in navigator && !window.TelegramWebViewProxy) {
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

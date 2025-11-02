// Wedding Website Enhancements
// This file handles countdown timer, guest book, RSVP, parallax, and other dynamic features

class WeddingEnhancements {
    constructor() {
        this.weddingDate = new Date('2026-03-14T14:00:00');
        this.init();
    }

    init() {
        console.log('🎉 Wedding Enhancements initialized');
        this.initCountdownTimer();
        this.initParallaxEffect();
        this.initAccessibilityImprovement();
        this.initMobileBottomNav();
        this.loadGalleryPhotos();
    }

    // Countdown Timer
    initCountdownTimer() {
        const updateCountdown = () => {
            const now = new Date();
            const difference = this.weddingDate - now;

            if (difference > 0) {
                const days = Math.floor(difference / (1000 * 60 * 60 * 24));
                const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((difference % (1000 * 60)) / 1000);

                const daysEl = document.getElementById('days');
                const hoursEl = document.getElementById('hours');
                const minutesEl = document.getElementById('minutes');
                const secondsEl = document.getElementById('seconds');

                if (daysEl) daysEl.textContent = days;
                if (hoursEl) hoursEl.textContent = hours;
                if (minutesEl) minutesEl.textContent = minutes;
                if (secondsEl) secondsEl.textContent = seconds;
            }
        };

        updateCountdown();
        setInterval(updateCountdown, 1000);
    }

    // RSVP Modal Functions
    openRSVP() {
        const modal = document.getElementById('rsvpModal');
        if (modal) modal.style.display = 'block';
    }

    closeRSVP() {
        const modal = document.getElementById('rsvpModal');
        if (modal) modal.style.display = 'none';
    }

    async submitRSVP(event) {
        event.preventDefault();

        const submitBtn = event.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
        submitBtn.disabled = true;

        const rsvpData = {
            name: document.getElementById('rsvpName').value,
            email: document.getElementById('rsvpEmail').value,
            phone: document.getElementById('rsvpPhone')?.value || '',
            attending: document.getElementById('rsvpAttending').value,
            guestCount: parseInt(document.getElementById('rsvpGuestCount').value) || 1,
            dietary: document.getElementById('rsvpDietary').value,
            message: document.getElementById('rsvpMessage')?.value || ''
        };

        try {
            const response = await fetch('/api/rsvp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(rsvpData)
            });

            const result = await response.json();

            if (result.success) {
                // Show success message
                const modalContent = document.querySelector('#rsvpModal .modal-content');
                modalContent.innerHTML = `
                    <div style="text-align: center; padding: 2rem;">
                        <i class="fas fa-check-circle" style="font-size: 4rem; color: var(--success); margin-bottom: 1rem;"></i>
                        <h2 style="color: var(--navy); margin-bottom: 1rem;">Thank You!</h2>
                        <p style="color: var(--light-navy); font-size: 1.1rem; margin-bottom: 2rem;">
                            ${rsvpData.attending === 'yes' ?
                                "We're so excited to celebrate with you!" :
                                "Thank you for letting us know. You'll be missed!"}
                        </p>
                        <button onclick="weddingEnhancements.closeRSVP()" class="btn btn-success">Close</button>
                    </div>
                `;

                // Close after 3 seconds
                setTimeout(() => {
                    this.closeRSVP();
                    // Reset form
                    location.reload();
                }, 3000);
            } else {
                throw new Error(result.error || 'Submission failed');
            }
        } catch (error) {
            console.error('RSVP error:', error);
            alert('❌ Failed to submit RSVP. Please try again or contact us directly.');
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    // Guest Book Modal Functions
    openGuestBook() {
        const modal = document.getElementById('guestBookModal');
        if (modal) modal.style.display = 'block';
        this.loadGuestBook();
    }

    closeGuestBook() {
        const modal = document.getElementById('guestBookModal');
        if (modal) modal.style.display = 'none';
    }

    loadGuestBook() {
        const entries = JSON.parse(localStorage.getItem('guestBookEntries') || '[]');
        const container = document.getElementById('guestBookEntries');
        if (container) {
            container.innerHTML = entries.map(entry => `
                <div class="guest-book-entry">
                    <strong>${this.escapeHtml(entry.name)}</strong>
                    <p>${this.escapeHtml(entry.message)}</p>
                    <small>${new Date(entry.timestamp).toLocaleDateString()}</small>
                </div>
            `).join('');
        }
    }

    submitGuestBookEntry(event) {
        event.preventDefault();
        const entry = {
            name: document.getElementById('gbName').value,
            message: document.getElementById('gbMessage').value,
            timestamp: new Date().toISOString()
        };

        let entries = JSON.parse(localStorage.getItem('guestBookEntries') || '[]');
        entries.push(entry);
        localStorage.setItem('guestBookEntries', JSON.stringify(entries));

        this.loadGuestBook();
        document.getElementById('guestBookForm').reset();
        alert('Thank you for your message!');
    }

    // Photo Modal Functions
    openPhotoModal(src) {
        const modal = document.getElementById('photoModal');
        const img = document.getElementById('modalPhoto');
        if (modal && img) {
            img.src = src;
            modal.style.display = 'block';
        }
    }

    closePhotoModal() {
        const modal = document.getElementById('photoModal');
        if (modal) modal.style.display = 'none';
    }

    // Photo Upload Handler
    async handlePhotoUpload(event) {
        const file = event.target.files[0];
        if (!file || !file.type.startsWith('image/')) {
            alert('Please select a valid image file');
            return;
        }

        // Show loading message
        const uploadBtn = document.querySelector('.upload-btn');
        const originalText = uploadBtn.innerHTML;
        uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
        uploadBtn.disabled = true;

        try {
            // Convert to base64
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const response = await fetch('/api/gallery/upload', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            image: e.target.result,
                            guestName: 'Guest'
                        })
                    });

                    const result = await response.json();

                    if (result.success) {
                        alert('✅ Photo uploaded successfully! Thank you for sharing!');
                        // Reload gallery
                        await this.loadGalleryPhotos();
                    } else {
                        throw new Error(result.error || 'Upload failed');
                    }
                } catch (error) {
                    console.error('Upload error:', error);
                    alert('❌ Failed to upload photo. Please try again.');
                } finally {
                    uploadBtn.innerHTML = originalText;
                    uploadBtn.disabled = false;
                    event.target.value = ''; // Reset file input
                }
            };
            reader.readAsDataURL(file);
        } catch (error) {
            console.error('File read error:', error);
            alert('❌ Failed to read file. Please try again.');
            uploadBtn.innerHTML = originalText;
            uploadBtn.disabled = false;
        }
    }

    // Load Gallery Photos
    async loadGalleryPhotos() {
        try {
            const response = await fetch('/api/gallery/photos');
            const photos = await response.json();

            const galleryContainer = document.getElementById('galleryPhotosGrid');
            const placeholder = document.getElementById('galleryPlaceholder');

            if (galleryContainer) {
                if (photos.length > 0) {
                    galleryContainer.innerHTML = photos.map(photo => `
                        <div class="gallery-photo-item" onclick="weddingEnhancements.openPhotoModal('${photo.url}')">
                            <img src="${photo.url}" alt="Wedding Photo" loading="lazy">
                        </div>
                    `).join('');
                    if (placeholder) placeholder.style.display = 'none';
                } else {
                    galleryContainer.innerHTML = '';
                    if (placeholder) placeholder.style.display = 'block';
                }
            }
        } catch (error) {
            console.error('Failed to load gallery photos:', error);
        }
    }

    // Utility function
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Parallax Scrolling Effect
    initParallaxEffect() {
        let ticking = false;

        const updateParallax = () => {
            const scrolled = window.pageYOffset;
            const heroBackground = document.querySelector('.hero-background');

            if (heroBackground && scrolled < window.innerHeight) {
                heroBackground.style.transform = `translateY(${scrolled * 0.5}px)`;
            }

            ticking = false;
        };

        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(updateParallax);
                ticking = true;
            }
        });
    }

    // Accessibility Improvements
    initAccessibilityImprovement() {
        // Add ARIA labels dynamically
        const nav = document.querySelector('.fixed-nav');
        if (nav) {
            nav.setAttribute('aria-label', 'Main navigation');
        }

        // Improve focus visibility
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                document.body.classList.add('keyboard-navigation');
            }
        });

        document.addEventListener('mousedown', () => {
            document.body.classList.remove('keyboard-navigation');
        });
    }

    // Mobile Bottom Navigation
    initMobileBottomNav() {
        if (window.innerWidth <= 768) {
            const createMobileNav = () => {
                const mobileNav = document.createElement('div');
                mobileNav.className = 'mobile-bottom-nav';
                mobileNav.innerHTML = `
                    <a href="#hero" class="mobile-nav-item">
                        <i class="fas fa-home"></i>
                        <span>Home</span>
                    </a>
                    <a href="#about" class="mobile-nav-item">
                        <i class="fas fa-heart"></i>
                        <span>About</span>
                    </a>
                    <a href="#schedule" class="mobile-nav-item">
                        <i class="fas fa-calendar"></i>
                        <span>Schedule</span>
                    </a>
                    <a href="#registry" class="mobile-nav-item">
                        <i class="fas fa-gift"></i>
                        <span>Registry</span>
                    </a>
                    <a href="#gallery" class="mobile-nav-item">
                        <i class="fas fa-camera"></i>
                        <span>Gallery</span>
                    </a>
                `;
                document.body.appendChild(mobileNav);
            };

            if (document.getElementById('mainWebsite') && !document.getElementById('mainWebsite').classList.contains('hidden')) {
                createMobileNav();
            }
        }
    }
}

// Guest Book Feature
class GuestBook {
    constructor() {
        this.messages = [];
        this.init();
    }

    init() {
        console.log('📖 Guest Book initialized');
        this.loadMessages();
        this.setupEventListeners();
    }

    async loadMessages() {
        try {
            const response = await fetch('/api/guestbook');
            if (response.ok) {
                this.messages = await response.json();
                this.renderMessages();
            }
        } catch (error) {
            console.log('Guest book not available yet');
        }
    }

    setupEventListeners() {
        const form = document.getElementById('guestbook-form');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.submitMessage();
            });
        }
    }

    async submitMessage() {
        const nameInput = document.getElementById('guestbook-name');
        const messageInput = document.getElementById('guestbook-message');

        if (!nameInput || !messageInput) return;

        const data = {
            name: nameInput.value.trim(),
            message: messageInput.value.trim(),
            timestamp: new Date().toISOString()
        };

        try {
            const response = await fetch('/api/guestbook', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                nameInput.value = '';
                messageInput.value = '';
                this.showToast('Thank you for your message!', 'success');
                await this.loadMessages();
            }
        } catch (error) {
            this.showToast('Unable to save message. Please try again.', 'error');
        }
    }

    renderMessages() {
        const container = document.getElementById('guestbook-messages');
        if (!container || this.messages.length === 0) return;

        container.innerHTML = this.messages.map(msg => `
            <div class="guestbook-message">
                <div class="guestbook-message-header">
                    <strong>${this.escapeHtml(msg.name)}</strong>
                    <span class="guestbook-date">${this.formatDate(msg.timestamp)}</span>
                </div>
                <p>${this.escapeHtml(msg.message)}</p>
            </div>
        `).join('');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    formatDate(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    showToast(message, type) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-triangle'}"></i> ${message}`;
        document.body.appendChild(toast);

        setTimeout(() => toast.classList.add('show'), 100);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => document.body.removeChild(toast), 300);
        }, 3000);
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.weddingEnhancements = new WeddingEnhancements();
        window.guestBook = new GuestBook();
    });
} else {
    window.weddingEnhancements = new WeddingEnhancements();
    window.guestBook = new GuestBook();
}

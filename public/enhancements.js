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
            attending: document.querySelector('input[name="attending"]:checked')?.value || '',
            guestCount: 1, // Fixed to 1 per invite
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

    // Image Compression Utility
    async compressImage(file, maxWidth = 1200, maxHeight = 1200, quality = 0.8) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    // Calculate new dimensions
                    let { width, height } = img;

                    if (width > maxWidth || height > maxHeight) {
                        const ratio = Math.min(maxWidth / width, maxHeight / height);
                        width = Math.round(width * ratio);
                        height = Math.round(height * ratio);
                    }

                    // Create canvas and draw resized image
                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    // Convert to base64 with compression
                    const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);

                    // Calculate size reduction
                    const originalSize = file.size;
                    const compressedSize = Math.round((compressedDataUrl.length - 22) * 3 / 4);
                    const savings = Math.round((1 - compressedSize / originalSize) * 100);

                    console.log(`📸 Image compressed: ${(originalSize / 1024).toFixed(1)}KB → ${(compressedSize / 1024).toFixed(1)}KB (${savings}% smaller)`);

                    resolve({
                        dataUrl: compressedDataUrl,
                        originalSize,
                        compressedSize,
                        savings,
                        width,
                        height
                    });
                };
                img.onerror = reject;
                img.src = e.target.result;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    // Photo Upload Handler with Compression
    async handlePhotoUpload(event) {
        const file = event.target.files[0];
        if (!file || !file.type.startsWith('image/')) {
            alert('Please select a valid image file');
            return;
        }

        // Check file size before compression
        const maxOriginalSize = 50 * 1024 * 1024; // 50MB max
        if (file.size > maxOriginalSize) {
            alert('❌ Image too large. Please select an image under 50MB.');
            return;
        }

        // Show loading message
        const uploadBtn = document.querySelector('.upload-btn');
        const originalText = uploadBtn.innerHTML;
        uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Optimizing...';
        uploadBtn.disabled = true;

        try {
            // Compress the image
            const compressed = await this.compressImage(file, 1600, 1600, 0.85);

            uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';

            const response = await fetch('/api/gallery/upload', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    image: compressed.dataUrl,
                    guestName: 'Guest'
                })
            });

            const result = await response.json();

            if (result.success) {
                const savingsMsg = compressed.savings > 0
                    ? ` (optimized ${compressed.savings}% smaller)`
                    : '';
                this.showToast(`Photo uploaded successfully!${savingsMsg}`, 'success');
                await this.loadGalleryPhotos();
            } else {
                throw new Error(result.error || 'Upload failed');
            }
        } catch (error) {
            console.error('Upload error:', error);
            this.showToast('Failed to upload photo. Please try again.', 'error');
        } finally {
            uploadBtn.innerHTML = originalText;
            uploadBtn.disabled = false;
            event.target.value = '';
        }
    }

    // Load Gallery Photos
    async loadGalleryPhotos() {
        const galleryContainer = document.getElementById('galleryPhotosGrid');
        const placeholder = document.getElementById('galleryPlaceholder');
        const uploadBtn = document.querySelector('.upload-btn');
        const uploadSection = uploadBtn?.closest('div');

        // Gallery opens March 14, 2026 at 5:00 PM NZ time
        const galleryOpenDate = new Date('2026-03-14T17:00:00+13:00');
        const now = new Date();

        if (now < galleryOpenDate) {
            // Gallery is locked - show countdown message
            if (galleryContainer) {
                galleryContainer.style.display = 'flex';
                galleryContainer.style.justifyContent = 'center';
                galleryContainer.style.minHeight = 'auto';
                galleryContainer.innerHTML = `
                    <div style="text-align: center; padding: 1rem 2rem 2rem;">
                        <i class="fas fa-lock" style="font-size: 3rem; color: var(--botanical-blue); opacity: 0.5; margin-bottom: 1rem; display: block;"></i>
                        <h3 style="color: var(--navy); margin-bottom: 0.5rem; font-size: 1.25rem;">Gallery Opens on Wedding Day</h3>
                        <p style="color: var(--light-navy); font-size: 0.95rem; margin: 0;">
                            The photo gallery will be available from 5:00 PM on March 14th, 2026.<br>
                            <span style="font-size: 0.85rem; opacity: 0.8;">Check back during the reception to share and view photos!</span>
                        </p>
                    </div>
                `;
            }
            if (placeholder) placeholder.style.display = 'none';
            if (uploadSection) uploadSection.style.display = 'none';
            return;
        }

        // Gallery is open - load photos
        try {
            const response = await fetch('/api/gallery/photos');
            const photos = await response.json();

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

    // Parallax Scrolling Effect (Desktop Only)
    initParallaxEffect() {
        // Disable parallax on mobile/tablet for performance
        const isMobile = window.matchMedia('(max-width: 768px)').matches;
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (isMobile || prefersReducedMotion) {
            console.log('🎨 Parallax disabled (mobile or reduced motion)');
            return;
        }

        let ticking = false;
        const heroBackground = document.querySelector('.hero-background');
        const botanicalTopLeft = document.querySelector('.botanical-top-left');
        const botanicalBottomRight = document.querySelector('.botanical-bottom-right');
        const heroContent = document.querySelector('.hero-content');

        const updateParallax = () => {
            const scrolled = window.pageYOffset;
            const viewportHeight = window.innerHeight;

            // Only apply effect when hero is in view
            if (scrolled < viewportHeight * 1.5) {
                // Hero background - moves slower (depth effect)
                if (heroBackground) {
                    heroBackground.style.transform = `translate3d(0, ${scrolled * 0.4}px, 0) scale(1.1)`;
                }

                // Botanical corners - move at different rates for layered depth
                if (botanicalTopLeft) {
                    botanicalTopLeft.style.transform = `translate3d(${scrolled * -0.15}px, ${scrolled * 0.2}px, 0)`;
                }
                if (botanicalBottomRight) {
                    botanicalBottomRight.style.transform = `translate3d(${scrolled * 0.15}px, ${scrolled * -0.1}px, 0)`;
                }

                // Hero content - subtle upward movement
                if (heroContent && scrolled < viewportHeight) {
                    const opacity = 1 - (scrolled / viewportHeight) * 0.6;
                    heroContent.style.transform = `translate3d(0, ${scrolled * -0.15}px, 0)`;
                    heroContent.style.opacity = Math.max(opacity, 0.3);
                }
            }

            ticking = false;
        };

        // Use passive listener for better scroll performance
        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(updateParallax);
                ticking = true;
            }
        }, { passive: true });

        console.log('🎨 Parallax effect initialized (desktop)');
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

    // Mobile Bottom Navigation with scroll behavior
    initMobileBottomNav() {
        const mobileNav = document.querySelector('.mobile-bottom-nav');
        if (!mobileNav) return;

        let lastScrollY = window.scrollY;
        let ticking = false;

        const updateNavVisibility = () => {
            const currentScrollY = window.scrollY;

            // Only apply hide/show if scrolled more than 10px
            if (Math.abs(currentScrollY - lastScrollY) < 10) {
                ticking = false;
                return;
            }

            if (currentScrollY > lastScrollY && currentScrollY > 100) {
                // Scrolling down - hide nav
                mobileNav.classList.add('nav-hidden');
            } else {
                // Scrolling up - show nav
                mobileNav.classList.remove('nav-hidden');
            }

            lastScrollY = currentScrollY;
            ticking = false;
        };

        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(updateNavVisibility);
                ticking = true;
            }
        }, { passive: true });

        // Highlight active section
        this.initActiveNavHighlight();
    }

    // Highlight active nav item based on scroll position
    initActiveNavHighlight() {
        const sections = ['hero', 'registry', 'gallery', 'faq'];
        const navItems = document.querySelectorAll('.mobile-bottom-nav .nav-item');

        const highlightNav = () => {
            const scrollY = window.scrollY + 100;

            sections.forEach((sectionId, index) => {
                const section = document.getElementById(sectionId);
                if (section) {
                    const sectionTop = section.offsetTop;
                    const sectionHeight = section.offsetHeight;

                    if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
                        navItems.forEach(item => item.classList.remove('active'));
                        // Find nav item that links to this section
                        const activeItem = document.querySelector(`.mobile-bottom-nav .nav-item[href="#${sectionId}"]`);
                        if (activeItem) activeItem.classList.add('active');
                    }
                }
            });
        };

        window.addEventListener('scroll', highlightNav, { passive: true });
        highlightNav(); // Initial call
    }

    // Global Toast Notification System
    showToast(message, type = 'success', duration = 4000) {
        // Remove existing toast if any
        const existingToast = document.querySelector('.toast');
        if (existingToast) {
            existingToast.remove();
        }

        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            info: 'fa-info-circle',
            warning: 'fa-exclamation-triangle'
        };

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `<i class="fas ${icons[type] || icons.info}"></i> ${message}`;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'polite');
        document.body.appendChild(toast);

        // Trigger animation
        setTimeout(() => toast.classList.add('show'), 50);

        // Auto dismiss
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, duration);

        // Haptic feedback on mobile
        if ('vibrate' in navigator) {
            navigator.vibrate(50);
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

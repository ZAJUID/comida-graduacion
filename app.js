/* ============================================
   COMIDA DE GRADUACIÓN 2026
   Application Logic
   ============================================ */

// --- Configuration ---
const CONFIG = {
    GOOGLE_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbyeADCYM0XpLcfH4nHVrIzgJtp0lMHCvcZu4tk81vbttQU1FCOUQsB3ejmZzlCI8ixn/exec',
    IMGBB_API_URL: 'https://api.imgbb.com/1/upload',
    IMGBB_API_KEY: '', // User needs to add their imgbb API key here
};

// --- DOM Elements ---
const DOM = {
    nav: document.getElementById('main-nav'),
    mobileMenuBtn: document.getElementById('mobile-menu-btn'),
    mobileMenu: document.getElementById('mobile-menu'),
    form: document.getElementById('registration-form'),
    submitBtn: document.getElementById('submit-btn'),
    btnText: null,
    btnLoading: null,
    successModal: document.getElementById('success-modal'),
    modalCloseBtn: document.getElementById('modal-close-btn'),
    guestsGrid: document.getElementById('guests-grid'),
    guestsLoading: document.getElementById('guests-loading'),
    guestsEmpty: document.getElementById('guests-empty'),
    guestCount: document.getElementById('guest-count'),
    galleryGrid: document.getElementById('gallery-grid'),
    galleryLoading: document.getElementById('gallery-loading'),
    galleryEmpty: document.getElementById('gallery-empty'),
    uploadZone: document.getElementById('upload-zone'),
    photoInput: document.getElementById('photo-input'),
    uploadProgress: document.getElementById('upload-progress'),
    progressFill: document.getElementById('progress-fill'),
    progressText: document.getElementById('progress-text'),
    lightbox: document.getElementById('lightbox'),
    lightboxImg: document.getElementById('lightbox-img'),
    lightboxClose: document.getElementById('lightbox-close'),
    lightboxPrev: document.getElementById('lightbox-prev'),
    lightboxNext: document.getElementById('lightbox-next'),
    installBtn: document.getElementById('install-btn'),
    mobileInstallBtn: document.getElementById('mobile-install-btn'),
    // Profile photo elements
    profilePhotoDropzone: document.getElementById('profile-photo-dropzone'),
    profilePhotoInput: document.getElementById('profile-photo-input'),
    profilePhotoPreview: document.getElementById('profile-photo-preview'),
    profilePhotoImg: document.getElementById('profile-photo-img'),
    profilePhotoRemove: document.getElementById('profile-photo-remove'),
};

// --- State ---
let galleryPhotos = [];
let currentPhotoIndex = 0;
let isSubmitting = false;
let profilePhotoFile = null;
let deferredPrompt = null;

// --- Initialize ---
document.addEventListener('DOMContentLoaded', () => {
    DOM.btnText = document.querySelector('.btn-text');
    DOM.btnLoading = document.querySelector('.btn-loading');
    
    initNavigation();
    initScrollAnimations();
    initForm();
    initProfilePhoto();
    initGalleryUpload();
    initLightbox();
    initPWA();
    loadGuests();
    loadGallery();
});

// ============================================
// NAVIGATION
// ============================================
function initNavigation() {
    // Scroll effect for nav
    let lastScroll = 0;
    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        
        // Add shadow on scroll
        if (scrollY > 10) {
            DOM.nav.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)';
        } else {
            DOM.nav.style.boxShadow = 'none';
        }
        
        lastScroll = scrollY;
    }, { passive: true });

    // Mobile menu toggle
    DOM.mobileMenuBtn.addEventListener('click', () => {
        DOM.mobileMenuBtn.classList.toggle('active');
        DOM.mobileMenu.classList.toggle('active');
    });

    // Close mobile menu on link click
    document.querySelectorAll('.mobile-link').forEach(link => {
        link.addEventListener('click', () => {
            DOM.mobileMenuBtn.classList.remove('active');
            DOM.mobileMenu.classList.remove('active');
        });
    });

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            e.preventDefault();
            const target = document.querySelector(anchor.getAttribute('href'));
            if (target) {
                const navHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-height'));
                const offsetTop = target.offsetTop - navHeight - 16;
                window.scrollTo({ top: offsetTop, behavior: 'smooth' });
            }
        });
    });
}

// ============================================
// SCROLL ANIMATIONS
// ============================================
function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const delay = entry.target.dataset.delay || 0;
                setTimeout(() => {
                    entry.target.classList.add('visible');
                }, parseInt(delay));
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.15,
        rootMargin: '0px 0px -60px 0px'
    });

    // Observe detail cards
    document.querySelectorAll('.detail-card').forEach(card => {
        observer.observe(card);
    });

    // Animated counter for guest count
    if (DOM.guestCount) {
        const counterObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateCounter();
                    counterObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        counterObserver.observe(DOM.guestCount);
    }
}

function animateCounter() {
    const target = parseInt(DOM.guestCount.textContent) || 0;
    if (target === 0) return;
    
    const duration = 1200;
    const start = performance.now();
    
    function update(currentTime) {
        const elapsed = currentTime - start;
        const progress = Math.min(elapsed / duration, 1);
        
        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(eased * target);
        
        DOM.guestCount.textContent = current;
        
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    
    DOM.guestCount.textContent = '0';
    requestAnimationFrame(update);
}

// ============================================
// REGISTRATION FORM
// ============================================
function initForm() {
    if (!DOM.form) return;
    
    DOM.form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (isSubmitting) return;
        if (!validateForm()) return;
        
        await submitRegistration();
    });

    // Real-time validation feedback
    DOM.form.querySelectorAll('.form-input').forEach(input => {
        input.addEventListener('blur', () => validateField(input));
        input.addEventListener('input', () => {
            if (input.classList.contains('error')) {
                validateField(input);
            }
        });
    });
}

// ============================================
// PROFILE PHOTO
// ============================================
function initProfilePhoto() {
    if (!DOM.profilePhotoDropzone) return;

    // Click dropzone to open file picker
    DOM.profilePhotoDropzone.addEventListener('click', () => {
        DOM.profilePhotoInput.click();
    });

    // Handle file selection
    DOM.profilePhotoInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
            handleProfilePhotoSelect(e.target.files[0]);
        }
    });

    // Remove photo button
    DOM.profilePhotoRemove.addEventListener('click', () => {
        profilePhotoFile = null;
        DOM.profilePhotoPreview.classList.add('hidden');
        DOM.profilePhotoDropzone.classList.remove('hidden');
        DOM.profilePhotoInput.value = '';
    });

    // Drag and drop on dropzone
    DOM.profilePhotoDropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        DOM.profilePhotoDropzone.style.borderColor = 'var(--color-accent)';
        DOM.profilePhotoDropzone.style.background = 'var(--color-accent-light)';
    });

    DOM.profilePhotoDropzone.addEventListener('dragleave', () => {
        DOM.profilePhotoDropzone.style.borderColor = '';
        DOM.profilePhotoDropzone.style.background = '';
    });

    DOM.profilePhotoDropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        DOM.profilePhotoDropzone.style.borderColor = '';
        DOM.profilePhotoDropzone.style.background = '';
        const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
        if (files.length > 0) {
            handleProfilePhotoSelect(files[0]);
        }
    });
}

function handleProfilePhotoSelect(file) {
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        alert('La imagen es demasiado grande. M\u00e1ximo 5MB.');
        return;
    }

    profilePhotoFile = file;

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
        DOM.profilePhotoImg.src = e.target.result;
        DOM.profilePhotoDropzone.classList.add('hidden');
        DOM.profilePhotoPreview.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
}

function validateForm() {
    const nombre = document.getElementById('nombre');
    const email = document.getElementById('email');
    const carrera = document.getElementById('carrera');
    
    let isValid = true;
    
    if (!validateField(nombre)) isValid = false;
    if (!validateField(email)) isValid = false;
    if (!validateField(carrera)) isValid = false;
    
    return isValid;
}

function validateField(input) {
    const errorEl = document.getElementById(`${input.id}-error`);
    let isValid = true;
    let message = '';

    if (input.required && !input.value.trim()) {
        isValid = false;
        message = 'Este campo es obligatorio';
    } else if (input.type === 'email' && input.value.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(input.value.trim())) {
            isValid = false;
            message = 'Ingresa un email válido';
        }
    }

    if (isValid) {
        input.classList.remove('error');
        if (errorEl) errorEl.textContent = '';
    } else {
        input.classList.add('error');
        if (errorEl) errorEl.textContent = message;
    }

    return isValid;
}

async function submitRegistration() {
    isSubmitting = true;
    DOM.submitBtn.disabled = true;
    DOM.btnText.classList.add('hidden');
    DOM.btnLoading.classList.remove('hidden');

    try {
        // Upload profile photo first if one was selected
        let profilePhotoUrl = '';
        if (profilePhotoFile) {
            try {
                DOM.btnLoading.querySelector('.btn-spinner')?.nextSibling && (DOM.btnLoading.childNodes.forEach(n => { if (n.nodeType === 3) n.textContent = ' Subiendo foto...'; }));
                profilePhotoUrl = await uploadToImgbb(profilePhotoFile);
            } catch (error) {
                console.error('Error uploading profile photo:', error);
                // Continue without photo rather than failing the whole registration
            }
        }

        // Update button text
        DOM.btnLoading.childNodes.forEach(n => { if (n.nodeType === 3) n.textContent = ' Registrando...'; });

        const formData = {
            action: 'register',
            nombre: document.getElementById('nombre').value.trim(),
            email: document.getElementById('email').value.trim(),
            telefono: document.getElementById('telefono').value.trim(),
            carrera: document.getElementById('carrera').value.trim(),
            acompanantes: document.getElementById('acompanantes').value,
            restricciones: document.getElementById('restricciones').value.trim(),
            mensaje: document.getElementById('mensaje').value.trim(),
            foto: profilePhotoUrl,
            timestamp: new Date().toISOString(),
        };

        const response = await fetch(CONFIG.GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
        });

        // Since no-cors mode doesn't return readable response,
        // we assume success if no error was thrown
        showSuccessModal();
        DOM.form.reset();
        
        // Reset profile photo state
        profilePhotoFile = null;
        DOM.profilePhotoPreview.classList.add('hidden');
        DOM.profilePhotoDropzone.classList.remove('hidden');
        DOM.profilePhotoInput.value = '';
        
        // Reload guests list after short delay
        setTimeout(() => loadGuests(), 2000);
        
    } catch (error) {
        console.error('Registration error:', error);
        alert('Hubo un error al registrar. Por favor intenta de nuevo.');
    } finally {
        isSubmitting = false;
        DOM.submitBtn.disabled = false;
        DOM.btnText.classList.remove('hidden');
        DOM.btnLoading.classList.add('hidden');
    }
}

function showSuccessModal() {
    DOM.successModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    
    DOM.modalCloseBtn.addEventListener('click', closeModal);
    DOM.successModal.addEventListener('click', (e) => {
        if (e.target === DOM.successModal) closeModal();
    });
}

function closeModal() {
    DOM.successModal.classList.add('hidden');
    document.body.style.overflow = '';
}

// ============================================
// LOAD GUESTS
// ============================================
async function loadGuests() {
    if (!DOM.guestsLoading) return;
    
    DOM.guestsLoading.classList.remove('hidden');
    DOM.guestsEmpty.classList.add('hidden');
    DOM.guestsGrid.innerHTML = '';

    try {
        const response = await fetch(`${CONFIG.GOOGLE_SCRIPT_URL}?action=getGuests`);
        const data = await response.json();
        
        if (data && data.guests && data.guests.length > 0) {
            DOM.guestsLoading.classList.add('hidden');
            
            // Update counter
            DOM.guestCount.textContent = data.guests.length;
            
            // Render guest cards with staggered animation
            data.guests.forEach((guest, index) => {
                const card = createGuestCard(guest, index);
                DOM.guestsGrid.appendChild(card);
            });
        } else {
            DOM.guestsLoading.classList.add('hidden');
            DOM.guestsEmpty.classList.remove('hidden');
            DOM.guestCount.textContent = '0';
        }
    } catch (error) {
        console.error('Error loading guests:', error);
        DOM.guestsLoading.classList.add('hidden');
        DOM.guestsEmpty.classList.remove('hidden');
        DOM.guestsEmpty.querySelector('p').textContent = 'No se pudieron cargar los invitados. Recarga la página para intentar de nuevo.';
    }
}

function createGuestCard(guest, index) {
    const card = document.createElement('div');
    card.className = 'guest-card';
    card.style.animationDelay = `${index * 60}ms`;
    
    const initials = getInitials(guest.nombre || 'NN');
    
    // Show profile photo if available, otherwise show initials
    let avatarContent;
    if (guest.foto) {
        avatarContent = `<img src="${escapeHtml(guest.foto)}" alt="${escapeHtml(guest.nombre || 'Invitado')}" loading="lazy" onerror="this.parentElement.innerHTML='${initials}'">`;
    } else {
        avatarContent = initials;
    }
    
    card.innerHTML = `
        <div class="guest-avatar">${avatarContent}</div>
        <div class="guest-name">${escapeHtml(guest.nombre || 'Anónimo')}</div>
        <div class="guest-carrera">${escapeHtml(guest.carrera || '')}</div>
        ${guest.mensaje ? `<div class="guest-message">"${escapeHtml(guest.mensaje)}"</div>` : ''}
    `;
    
    return card;
}

function getInitials(name) {
    return name
        .split(' ')
        .filter(word => word.length > 0)
        .slice(0, 2)
        .map(word => word[0].toUpperCase())
        .join('');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================
// PHOTO GALLERY
// ============================================
function initGalleryUpload() {
    if (!DOM.uploadZone) return;
    
    // Click to upload
    DOM.uploadZone.addEventListener('click', () => {
        DOM.photoInput.click();
    });

    // File input change
    DOM.photoInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handlePhotoUpload(Array.from(e.target.files));
        }
    });

    // Drag and drop
    DOM.uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        DOM.uploadZone.classList.add('dragover');
    });

    DOM.uploadZone.addEventListener('dragleave', () => {
        DOM.uploadZone.classList.remove('dragover');
    });

    DOM.uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        DOM.uploadZone.classList.remove('dragover');
        
        const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
        if (files.length > 0) {
            handlePhotoUpload(files);
        }
    });
}

async function handlePhotoUpload(files) {
    if (!CONFIG.IMGBB_API_KEY) {
        alert('API Key de imgbb no configurada. Por favor contacta al administrador.');
        return;
    }

    DOM.uploadProgress.classList.remove('hidden');
    let uploaded = 0;
    const total = files.length;

    for (const file of files) {
        try {
            DOM.progressText.textContent = `Subiendo ${uploaded + 1} de ${total}...`;
            DOM.progressFill.style.width = `${((uploaded) / total) * 100}%`;

            const imageUrl = await uploadToImgbb(file);
            
            if (imageUrl) {
                // Save photo reference to Google Sheet
                await savePhotoReference(imageUrl);
                
                // Add to gallery immediately
                addPhotoToGallery(imageUrl);
                uploaded++;
                DOM.progressFill.style.width = `${(uploaded / total) * 100}%`;
            }
        } catch (error) {
            console.error('Error uploading photo:', error);
        }
    }

    DOM.progressText.textContent = `${uploaded} de ${total} fotos subidas ✓`;
    DOM.progressFill.style.width = '100%';
    
    setTimeout(() => {
        DOM.uploadProgress.classList.add('hidden');
        DOM.progressFill.style.width = '0%';
    }, 2000);

    DOM.photoInput.value = '';
}

async function uploadToImgbb(file) {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('key', CONFIG.IMGBB_API_KEY);

    const response = await fetch(CONFIG.IMGBB_API_URL, {
        method: 'POST',
        body: formData,
    });

    const data = await response.json();
    
    if (data.success) {
        return data.data.url;
    }
    
    throw new Error('imgbb upload failed');
}

async function savePhotoReference(imageUrl) {
    try {
        await fetch(CONFIG.GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'addPhoto',
                url: imageUrl,
                timestamp: new Date().toISOString(),
            }),
        });
    } catch (error) {
        console.error('Error saving photo reference:', error);
    }
}

function addPhotoToGallery(url) {
    DOM.galleryEmpty.classList.add('hidden');
    
    galleryPhotos.push(url);
    const index = galleryPhotos.length - 1;
    
    const item = document.createElement('div');
    item.className = 'gallery-item';
    item.style.animationDelay = `${index * 80}ms`;
    item.innerHTML = `<img src="${url}" alt="Foto de la graduación" loading="lazy">`;
    item.addEventListener('click', () => openLightbox(index));
    
    DOM.galleryGrid.appendChild(item);
}

async function loadGallery() {
    if (!DOM.galleryLoading) return;
    
    DOM.galleryLoading.classList.remove('hidden');
    DOM.galleryEmpty.classList.add('hidden');

    try {
        const response = await fetch(`${CONFIG.GOOGLE_SCRIPT_URL}?action=getPhotos`);
        const data = await response.json();
        
        DOM.galleryLoading.classList.add('hidden');
        
        if (data && data.photos && data.photos.length > 0) {
            galleryPhotos = data.photos.map(p => p.url);
            
            galleryPhotos.forEach((url, index) => {
                const item = document.createElement('div');
                item.className = 'gallery-item';
                item.style.animationDelay = `${index * 80}ms`;
                item.innerHTML = `<img src="${url}" alt="Foto de la graduación" loading="lazy">`;
                item.addEventListener('click', () => openLightbox(index));
                DOM.galleryGrid.appendChild(item);
            });
        } else {
            DOM.galleryEmpty.classList.remove('hidden');
        }
    } catch (error) {
        console.error('Error loading gallery:', error);
        DOM.galleryLoading.classList.add('hidden');
        DOM.galleryEmpty.classList.remove('hidden');
    }
}

// ============================================
// LIGHTBOX
// ============================================
function initLightbox() {
    if (!DOM.lightboxClose) return;

    DOM.lightboxClose.addEventListener('click', closeLightbox);
    DOM.lightboxPrev.addEventListener('click', () => navigateLightbox(-1));
    DOM.lightboxNext.addEventListener('click', () => navigateLightbox(1));

    DOM.lightbox.addEventListener('click', (e) => {
        if (e.target === DOM.lightbox) closeLightbox();
    });

    document.addEventListener('keydown', (e) => {
        if (DOM.lightbox.classList.contains('hidden')) return;
        
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') navigateLightbox(-1);
        if (e.key === 'ArrowRight') navigateLightbox(1);
    });
}

function openLightbox(index) {
    currentPhotoIndex = index;
    DOM.lightboxImg.src = galleryPhotos[index];
    DOM.lightbox.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    
    updateLightboxNav();
}

function closeLightbox() {
    DOM.lightbox.classList.add('hidden');
    document.body.style.overflow = '';
}

function navigateLightbox(direction) {
    currentPhotoIndex += direction;
    
    if (currentPhotoIndex < 0) currentPhotoIndex = galleryPhotos.length - 1;
    if (currentPhotoIndex >= galleryPhotos.length) currentPhotoIndex = 0;
    
    DOM.lightboxImg.src = galleryPhotos[currentPhotoIndex];
    updateLightboxNav();
}

function updateLightboxNav() {
    DOM.lightboxPrev.style.display = galleryPhotos.length > 1 ? 'block' : 'none';
    DOM.lightboxNext.style.display = galleryPhotos.length > 1 ? 'block' : 'none';
}

// ============================================
// PWA & SERVICE WORKER
// ============================================
function initPWA() {
    // Register Service Worker
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js')
                .then((registration) => {
                    console.log('SW registered:', registration);
                })
                .catch((error) => {
                    console.log('SW registration failed:', error);
                });
        });
    }

    // Detect if device is iOS since it doesn't support beforeinstallprompt
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

    if (isIOS) {
        // Apple devices require manual installation via Share button
        if (DOM.installBtn) DOM.installBtn.classList.remove('hidden');
        if (DOM.mobileInstallBtn) DOM.mobileInstallBtn.classList.remove('hidden');
        
        const showIOSInstructions = (e) => {
            e.preventDefault();
            alert('Para instalar en iPhone/iPad:\n\n1. Toca el botón "Compartir" (⍐) en la barra inferior de Safari.\n2. Elige "Agregar a Inicio" en el menú (+).\n3. Confirma dándole a "Agregar".');
        };

        if (DOM.installBtn) DOM.installBtn.addEventListener('click', showIOSInstructions);
        if (DOM.mobileInstallBtn) DOM.mobileInstallBtn.addEventListener('click', showIOSInstructions);
    } else {
        // Handle install prompt for Android/Desktop
        window.addEventListener('beforeinstallprompt', (e) => {
            // Prevent Chrome 67 and earlier from automatically showing the prompt
            e.preventDefault();
            // Stash the event so it can be triggered later.
            deferredPrompt = e;
            // Update UI to notify the user they can add to home screen
            if (DOM.installBtn) DOM.installBtn.classList.remove('hidden');
            if (DOM.mobileInstallBtn) DOM.mobileInstallBtn.classList.remove('hidden');
        });

        const handleInstallClick = async (e) => {
            e.preventDefault();
            if (DOM.installBtn) DOM.installBtn.classList.add('hidden');
            if (DOM.mobileInstallBtn) DOM.mobileInstallBtn.classList.add('hidden');
            
            if (deferredPrompt) {
                // Show the install prompt
                deferredPrompt.prompt();
                // Wait for the user to respond to the prompt
                const { outcome } = await deferredPrompt.userChoice;
                console.log(`User response to the install prompt: ${outcome}`);
                // We've used the prompt, and can't use it again, throw it away
                deferredPrompt = null;
            }
        };

        if (DOM.installBtn) DOM.installBtn.addEventListener('click', handleInstallClick);
        if (DOM.mobileInstallBtn) DOM.mobileInstallBtn.addEventListener('click', handleInstallClick);
    }

    window.addEventListener('appinstalled', () => {
        // Hide the app-provided install promotion
        if (DOM.installBtn) DOM.installBtn.classList.add('hidden');
        if (DOM.mobileInstallBtn) DOM.mobileInstallBtn.classList.add('hidden');
        // Clear the deferredPrompt so it can be garbage collected
        deferredPrompt = null;
        console.log('PWA was installed');
    });
}

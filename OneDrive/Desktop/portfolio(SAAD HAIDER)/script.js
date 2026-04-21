/* ─────────────────────────────────────────
   SAAD HAIDER PORTFOLIO — script.js
   Dark premium theme interactions
───────────────────────────────────────── */

/* ══════════════════════════════════════
   NAVBAR
══════════════════════════════════════ */
const navbar = document.getElementById('navbar');
const hamburger = document.getElementById('hamburger');
const mobileNav = document.getElementById('mobileNav');

window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
}, { passive: true });

hamburger.addEventListener('click', () => mobileNav.classList.toggle('open'));

document.querySelectorAll('.mobile-link').forEach(link => {
    link.addEventListener('click', () => mobileNav.classList.remove('open'));
});

/* ══════════════════════════════════════
   SMOOTH ANCHOR SCROLL
══════════════════════════════════════ */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});

/* ══════════════════════════════════════
   TYPING EFFECT
══════════════════════════════════════ */
const typedTextEl = document.getElementById('typedText');
const roles = ['Frontend Developer', 'React Developer', 'Next.js Expert', 'Web Designer', 'SEO Specialist'];
let roleIndex = 0;
let charIndex = 0;
let isDeleting = false;

function typeEffect() {
    const currentRole = roles[roleIndex];

    if (isDeleting) {
        typedTextEl.textContent = currentRole.substring(0, charIndex - 1);
        charIndex--;
    } else {
        typedTextEl.textContent = currentRole.substring(0, charIndex + 1);
        charIndex++;
    }

    let typeSpeed = isDeleting ? 40 : 80;

    if (!isDeleting && charIndex === currentRole.length) {
        typeSpeed = 2000; // pause at end
        isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        roleIndex = (roleIndex + 1) % roles.length;
        typeSpeed = 400;
    }

    setTimeout(typeEffect, typeSpeed);
}

typeEffect();

/* ══════════════════════════════════════
   SKILL BARS ANIMATION
══════════════════════════════════════ */
const skillFills = document.querySelectorAll('.skill-fill');

const skillObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            skillFills.forEach(bar => {
                const targetWidth = bar.getAttribute('data-width');
                bar.style.width = targetWidth + '%';
            });
            skillObserver.disconnect();
        }
    });
}, { threshold: 0.3 });

const skillSection = document.querySelector('.skills-section');
if (skillSection) skillObserver.observe(skillSection);

/* ══════════════════════════════════════
   PORTFOLIO CARDS STAGGER
══════════════════════════════════════ */
const portfolioCards = document.querySelectorAll('.portfolio-card');

const cardObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const cards = entry.target.querySelectorAll('.portfolio-card');
            cards.forEach((card, i) => {
                setTimeout(() => card.classList.add('visible'), i * 120);
            });
            cardObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.1 });

const portfolioGrid = document.querySelector('.portfolio-grid');
if (portfolioGrid) cardObserver.observe(portfolioGrid);

/* ══════════════════════════════════════
   SECTION REVEAL (fade + lift)
══════════════════════════════════════ */
const revealTargets = document.querySelectorAll(
    '.section-tag, .section-title, .about-grid, .services-grid, .timeline-item, ' +
    '.skills-grid, .certs-grid, .contact-grid, .portfolio-more, ' +
    '.stats-bar-inner, .quick-info-card, .interests-card'
);

revealTargets.forEach(el => el.classList.add('reveal'));

const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            revealObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.06, rootMargin: '0px 0px -40px 0px' });

revealTargets.forEach(el => revealObserver.observe(el));

/* ══════════════════════════════════════
   CONTACT FORM
══════════════════════════════════════ */
const contactForm = document.getElementById('contactForm');
if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const name = document.getElementById('cf-name').value.trim();
        const email = document.getElementById('cf-email').value.trim();
        const msg = document.getElementById('cf-msg').value.trim();
        if (!name || !email || !msg) { alert('Please fill in all fields.'); return; }

        const btn = this.querySelector('.form-submit');
        const orig = btn.textContent;
        btn.textContent = 'Sent! ✓';
        btn.style.opacity = '0.6';
        btn.disabled = true;
        setTimeout(() => {
            btn.textContent = orig;
            btn.style.opacity = '';
            btn.disabled = false;
            this.reset();
        }, 3000);
    });
}

/* ══════════════════════════════════════
   COUNTER ANIMATION for stats
══════════════════════════════════════ */
function animateCounters() {
    const statNumbers = document.querySelectorAll('.stat-item .stat-number');
    statNumbers.forEach(el => {
        const text = el.textContent;
        const match = text.match(/(\d+)/);
        if (!match) return;

        const target = parseInt(match[1]);
        const suffix = text.replace(match[1], '');
        let current = 0;
        const duration = 1500;
        const step = target / (duration / 16);

        const counter = setInterval(() => {
            current += step;
            if (current >= target) {
                current = target;
                clearInterval(counter);
            }
            el.textContent = Math.floor(current) + suffix;
        }, 16);
    });
}

const statsBar = document.querySelector('.stats-bar');
if (statsBar) {
    const statsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounters();
                statsObserver.disconnect();
            }
        });
    }, { threshold: 0.3 });
    statsObserver.observe(statsBar);
}

/* ══════════════════════════════════════
   CERTIFICATE MODAL
══════════════════════════════════════ */
function openCertModal(e) {
    e.stopPropagation();
    const modal = document.getElementById('certModal');
    const img = document.getElementById('certModalImg');
    const certImg = e.target.closest('.cert-card-clickable').querySelector('.cert-card-img img');
    
    img.src = certImg.src;
    img.alt = certImg.alt;
    modal.classList.add('open');
    
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
}

function closeCertModal() {
    const modal = document.getElementById('certModal');
    modal.classList.remove('open');
    
    // Re-enable body scroll
    document.body.style.overflow = '';
}

// Close modal when pressing Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeCertModal();
    }
});

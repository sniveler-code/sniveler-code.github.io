/**
 * Sniveler Code — Main JavaScript (index.html)
 * Handles: scroll reveal, mobile nav, accessibility
 */

(function () {
    'use strict';

    // ==========================================================================
    // Utility: Debounce
    // ==========================================================================
    function debounce(fn, delay) {
        let timeoutId;
        return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => fn.apply(this, args), delay);
        };
    }

    // ==========================================================================
    // 1. Scroll Reveal (IntersectionObserver)
    // ==========================================================================
    function initScrollReveal() {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const reveals = document.querySelectorAll('.reveal');

        if (prefersReducedMotion) {
            reveals.forEach(el => el.classList.add('active'));
            return;
        }

        if (!reveals.length) return;

        const revealObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            root: null,
            rootMargin: '0px',
            threshold: 0.15
        });

        reveals.forEach(reveal => revealObserver.observe(reveal));
    }

    // ==========================================================================
    // 2. Smooth Scroll for Anchor Links (with nav offset)
    // ==========================================================================
    function initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                const href = this.getAttribute('href');
                if (!href || href === '#') return;

                const target = document.querySelector(href);
                if (target) {
                    e.preventDefault();
                    const nav = document.querySelector('nav');
                    const navHeight = nav?.offsetHeight || 80;
                    const top = target.getBoundingClientRect().top + window.scrollY - navHeight - 10;
                    window.scrollTo({ top, behavior: 'smooth' });
                    history.pushState(null, '', href);
                }
            });
        });
    }

    // ==========================================================================
    // 3. Mobile Nav: Close on resize > 768px
    // ==========================================================================
    function initMobileNav() {
        // This is handled by CSS, but we can add JS enhancements if needed
        // For now, the CSS @media handles the responsive nav
    }

    // ==========================================================================
    // 4. External Links: Add rel="noopener noreferrer"
    // ==========================================================================
    function secureExternalLinks() {
        document.querySelectorAll('a[href^="http"]').forEach(link => {
            if (!link.hostname.includes(window.location.hostname)) {
                link.setAttribute('rel', 'noopener noreferrer');
                link.setAttribute('target', '_blank');
            }
        });
    }

    // ==========================================================================
    // 5. Image Lazy Loading Fallback
    // ==========================================================================
    function initLazyImages() {
        if ('loading' in HTMLImageElement.prototype) return;

        const lazyImages = document.querySelectorAll('img[loading="lazy"]');
        if (!lazyImages.length) return;

        const imgObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src || img.src;
                    img.removeAttribute('loading');
                    observer.unobserve(img);
                }
            });
        });

        lazyImages.forEach(img => imgObserver.observe(img));
    }

    // ==========================================================================
    // 6. Dynamic Copyright Year
    // ==========================================================================
    function updateCopyrightYear() {
        const yearEl = document.getElementById('current-year');
        if (yearEl) {
            yearEl.textContent = new Date().getFullYear();
        }
    }

    // ==========================================================================
    // Init All
    // ==========================================================================
    function init() {
        initScrollReveal();
        initSmoothScroll();
        initMobileNav();
        secureExternalLinks();
        initLazyImages();
        updateCopyrightYear();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Expose for manual re-init
    window.SnivelerMain = {
        initScrollReveal,
        initSmoothScroll
    };
})();
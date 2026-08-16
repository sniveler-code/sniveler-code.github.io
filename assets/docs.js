/**
 * Sniveler Code — Documentation Shared JavaScript
 * Handles: sidebar navigation, active section highlighting, copy code buttons, mobile nav
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
    // 1. Sidebar Smooth Scroll + Hash Update
    // ==========================================================================
    function initSidebarNavigation() {
        document.querySelectorAll('.sidebar a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                const href = this.getAttribute('href');
                if (!href || href === '#') return;

                e.preventDefault();
                const id = href.slice(1);
                const target = document.getElementById(id);
                if (target) {
                    const navHeight = document.querySelector('nav')?.offsetHeight || 80;
                    const top = target.getBoundingClientRect().top + window.scrollY - navHeight - 10;
                    window.scrollTo({ top, behavior: 'smooth' });
                    history.pushState(null, '', href);
                    updateActiveSidebarLink(href);
                }
                // Close mobile nav
                const details = document.getElementById('nav-details');
                if (details && window.innerWidth <= 992) {
                    details.removeAttribute('open');
                }
            });
        });
    }

    // ==========================================================================
    // 2. Active Section Highlighting (IntersectionObserver on headings)
    // ==========================================================================
    function initActiveSectionHighlighting() {
        const headings = document.querySelectorAll('.content-area h1, .content-area h2, .content-area h3');
        if (!headings.length) return;

        const sidebarLinks = new Map();
        document.querySelectorAll('.sidebar a[href^="#"]').forEach(link => {
            sidebarLinks.set(link.getAttribute('href'), link);
        });

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = '#' + entry.target.id;
                    updateActiveSidebarLink(id);
                }
            });
        }, {
            root: null,
            rootMargin: '-100px 0px -66% 0px', // Trigger when heading enters upper third
            threshold: 0
        });

        headings.forEach(h => observer.observe(h));

        function updateActiveSidebarLink(activeId) {
            sidebarLinks.forEach((link, href) => {
                link.classList.toggle('active', href === activeId);
            });
        }
    }

    // ==========================================================================
    // 3. Mobile Nav Resize Handler
    // ==========================================================================
    function initMobileNav() {
        const details = document.getElementById('nav-details');
        if (!details) return;

        function handleResize() {
            if (window.innerWidth <= 992) {
                details.removeAttribute('open');
            } else {
                details.setAttribute('open', '');
            }
        }
        window.addEventListener('resize', debounce(handleResize, 100));
        handleResize();
    }

    // ==========================================================================
    // 4. Copy Code Button for Pre Blocks
    // ==========================================================================
    function initCodeCopyButtons() {
        document.querySelectorAll('.content-area pre').forEach(pre => {
            // Skip if already wrapped
            if (pre.parentElement.classList.contains('code-block-wrapper')) return;

            const wrapper = document.createElement('div');
            wrapper.className = 'code-block-wrapper';
            pre.parentNode.insertBefore(wrapper, pre);
            wrapper.appendChild(pre);

            const btn = document.createElement('button');
            btn.className = 'copy-code-btn';
            btn.textContent = 'Copy';
            btn.setAttribute('aria-label', 'Copy code to clipboard');
            pre.appendChild(btn);

            btn.addEventListener('click', async () => {
                const code = pre.querySelector('code')?.innerText || pre.innerText;
                try {
                    await navigator.clipboard.writeText(code);
                    btn.textContent = 'Copied!';
                    btn.classList.add('copied');
                    setTimeout(() => {
                        btn.textContent = 'Copy';
                        btn.classList.remove('copied');
                    }, 2000);
                } catch (e) {
                    btn.textContent = 'Failed';
                    setTimeout(() => btn.textContent = 'Copy', 2000);
                }
            });
        });
    }

    // ==========================================================================
    // 5. Respect prefers-reduced-motion for Scroll Reveal
    // ==========================================================================
    function initScrollReveal() {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion) {
            document.querySelectorAll('.reveal').forEach(el => el.classList.add('active'));
            return;
        }

        const reveals = document.querySelectorAll('.reveal');
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
    // 6. Table of Contents Toggle (Mobile)
    // ==========================================================================
    function initTocToggle() {
        const summary = document.querySelector('details.mobile-nav summary');
        if (!summary) return;

        summary.addEventListener('click', () => {
            const details = summary.parentElement;
            const isOpen = details.hasAttribute('open');
            // Toggle handled by browser, but we can add animation class
            details.classList.toggle('toc-open', !isOpen);
        });
    }

    // ==========================================================================
    // 7. External Links: Add rel="noopener noreferrer"
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
    // 8. Image Lazy Loading Fallback (for older browsers)
    // ==========================================================================
    function initLazyImages() {
        if ('loading' in HTMLImageElement.prototype) return; // Native supported

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
    // Init All
    // ==========================================================================
    function init() {
        initSidebarNavigation();
        initActiveSectionHighlighting();
        initMobileNav();
        initCodeCopyButtons();
        initScrollReveal();
        initTocToggle();
        secureExternalLinks();
        initLazyImages();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Expose for manual re-init (e.g., after dynamic content load)
    window.SnivelerDocs = {
        initCodeCopyButtons,
        initActiveSectionHighlighting,
        initScrollReveal
    };
})();
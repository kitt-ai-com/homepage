document.addEventListener('DOMContentLoaded', () => {

    // Mobile Menu Toggle
    const menuBtn = document.querySelector('.nav-menu-btn');
    const navLinks = document.querySelector('.nav-links');

    if (menuBtn && navLinks) {
        menuBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });

        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
            });
        });
    }

    // Header scroll effect
    const header = document.querySelector('.header');
    if (header) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });
    }

    // FAQ Toggle
    document.querySelectorAll('.faq-question').forEach(btn => {
        btn.addEventListener('click', () => {
            const item = btn.closest('.faq-item');
            const isOpen = item.classList.contains('open');

            // Close all other items
            document.querySelectorAll('.faq-item.open').forEach(openItem => {
                openItem.classList.remove('open');
            });

            // Toggle current
            if (!isOpen) {
                item.classList.add('open');
            }
        });
    });

    // Scroll Animations (Fade In)
    const fadeSelectors = [
        '.section-header-centered',
        '.solution-card',
        '.service-card',
        '.data-item',
        '.testimonial-card',
        '.onboarding-step',
        '.faq-item',
        '.problem-content',
        '.hero-center',
        '.trust-bar .container',
        '.footer-main',
        '.footer-info',
        '.footer-bottom'
    ];

    const fadeElements = document.querySelectorAll(fadeSelectors.join(', '));

    fadeElements.forEach(el => {
        el.classList.add('fade-in-element');
    });

    // Add stagger classes to grid children
    document.querySelectorAll('.service-grid, .solution-grid, .data-dashboard, .testimonial-grid, .onboarding-grid').forEach(grid => {
        Array.from(grid.children).forEach((child, i) => {
            child.classList.add('fade-in-element', 'stagger-' + Math.min(i + 1, 4));
        });
    });

    const fadeObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });

    document.querySelectorAll('.fade-in-element').forEach(el => {
        fadeObserver.observe(el);
    });

    // Number Counter Animation
    const counterObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = entry.target;
                const start = parseFloat(target.getAttribute('data-start'));
                const end = parseFloat(target.getAttribute('data-end'));
                const suffix = target.getAttribute('data-suffix') || '';
                const duration = 2000;
                const startTime = performance.now();

                function update(currentTime) {
                    const elapsed = currentTime - startTime;
                    const progress = Math.min(elapsed / duration, 1);
                    const ease = 1 - Math.pow(1 - progress, 4);
                    const current = start + (end - start) * ease;

                    let formattedNumber = Math.floor(current);
                    if (end % 1 !== 0) {
                        formattedNumber = current.toFixed(1);
                    }

                    target.textContent = formattedNumber + suffix;

                    if (progress < 1) {
                        requestAnimationFrame(update);
                    } else {
                        target.textContent = end + suffix;
                    }
                }

                requestAnimationFrame(update);
                observer.unobserve(target);
            }
        });
    }, { threshold: 0.5 });

    document.querySelectorAll('.data-value').forEach(el => {
        counterObserver.observe(el);
    });

    console.log('kitt - Initialized');
});

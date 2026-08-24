/* ============================================================
   Kitt — shared client JS
   Loaded on every page. Page-specific scripts live in
   assets/pages/<page>.js (loaded after this one).
   ============================================================ */
(() => {
  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  /* ---------- Custom cursor ---------- */
  const cursor = $('.cursor');
  const ring   = $('.cursor-ring');
  if (cursor && ring) {
    let mx = innerWidth / 2, my = innerHeight / 2;
    let rx = mx, ry = my;
    addEventListener('mousemove', (e) => {
      mx = e.clientX; my = e.clientY;
      cursor.style.left = mx + 'px';
      cursor.style.top  = my + 'px';
    });
    (function tick() {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      ring.style.left = rx + 'px';
      ring.style.top  = ry + 'px';
      requestAnimationFrame(tick);
    })();
    $$('[data-cursor]').forEach((el) => {
      el.addEventListener('mouseenter', () => {
        cursor.classList.add('is-hover');
        ring.classList.add('is-hover');
      });
      el.addEventListener('mouseleave', () => {
        cursor.classList.remove('is-hover');
        ring.classList.remove('is-hover');
      });
    });
  }

  /* ---------- Magnetic buttons ---------- */
  $$('.magnetic').forEach((btn) => {
    btn.addEventListener('mousemove', (e) => {
      const r  = btn.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width  / 2)) * 0.25;
      const dy = (e.clientY - (r.top  + r.height / 2)) * 0.25;
      btn.style.transform = `translate(${dx}px, ${dy}px)`;
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = 'translate(0,0)';
    });
  });

  /* ---------- Nav scroll state ---------- */
  const nav = $('nav.top');
  if (nav) {
    addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', scrollY > 20);
    }, { passive: true });
  }

  /* ---------- Reveal on scroll ---------- */
  const reveals = $$('.reveal');
  if (reveals.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });
    reveals.forEach((el) => io.observe(el));
  }

  /* ---------- FAQ accordion (no-op if absent) ---------- */
  $$('.faq-item').forEach((item) => {
    item.addEventListener('click', () => item.classList.toggle('open'));
  });

  /* ---------- Portfolio / Education filter ---------- */
  const filterBtns  = $$('.filter-btn');
  const filterCards = $$('.pf-card');
  if (filterBtns.length && filterCards.length) {
    filterBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const label = btn.textContent.trim();
        filterBtns.forEach((b) => b.classList.toggle('active', b === btn));
        filterCards.forEach((card) => {
          const cat = (card.dataset.category || '').trim();
          card.style.display = (label === 'ALL' || cat === label) ? '' : 'none';
        });
      });
    });
  }

  /* ---------- Mobile nav (hamburger) ---------- */
  const navToggle = $('.nav-toggle');
  if (navToggle) {
    const closeMenu = () => document.body.classList.remove('nav-open');
    navToggle.addEventListener('click', () => {
      document.body.classList.toggle('nav-open');
    });
    $$('.nav-links a').forEach((a) => a.addEventListener('click', closeMenu));
    addEventListener('resize', () => {
      if (innerWidth > 768) closeMenu();
    });
  }

  /* ---------- Team slider drag-to-scroll ----------
     Touch devices scroll the strip natively; this adds
     mouse dragging on the cards. Snap is disabled while
     dragging and the strip smooth-snaps to the nearest
     card on release. */
  const teamSlider = $('.team');
  if (teamSlider) {
    let down = false, dragged = false, startX = 0, startLeft = 0;
    teamSlider.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      down = true; dragged = false;
      startX = e.clientX; startLeft = teamSlider.scrollLeft;
      teamSlider.classList.add('dragging');
    });
    addEventListener('pointermove', (e) => {
      if (!down) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 5) dragged = true;
      teamSlider.scrollLeft = startLeft - dx;
    });
    const release = () => {
      if (!down) return;
      down = false;
      const card = $('.member', teamSlider);
      if (card && dragged) {
        const gap  = parseFloat(getComputedStyle(teamSlider).columnGap) || 0;
        const step = card.offsetWidth + gap;
        teamSlider.scrollTo({ left: Math.round(teamSlider.scrollLeft / step) * step, behavior: 'smooth' });
      }
      setTimeout(() => teamSlider.classList.remove('dragging'), 400);
    };
    addEventListener('pointerup', release);
    addEventListener('pointercancel', release);
    teamSlider.addEventListener('dragstart', (e) => e.preventDefault());
    teamSlider.addEventListener('click', (e) => {
      if (dragged) { e.preventDefault(); e.stopPropagation(); }
    }, true);
  }

  /* ---------- Dark-section cursor inversion ----------
     Light-theme pages only. Mark dark sections in markup
     with the [data-on-dark] attribute; when one crosses
     the viewport center, body.on-dark is toggled and CSS
     inverts the cursor. Dark-theme pages skip this — body
     is already dark, the cursor is already inverted by CSS.
  */
  if (!document.body.classList.contains('theme-dark')) {
    const darkSections = $$('[data-on-dark]');
    if (darkSections.length) {
      const checkDark = () => {
        const mid = innerHeight / 2;
        const isDark = darkSections.some((s) => {
          const r = s.getBoundingClientRect();
          return r.top < mid && r.bottom > mid;
        });
        document.body.classList.toggle('on-dark', isDark);
      };
      addEventListener('scroll', checkDark, { passive: true });
      checkDark();
    }
  }

  /* ---------- Quick menu (contact / kakao / scroll-to-top) ---------- */
  if (!$('.quick-menu')) {
    const menu = document.createElement('div');
    menu.className = 'quick-menu';
    menu.innerHTML = `
      <a class="qm-btn qm-contact" href="/#contact" aria-label="문의하기">
        <span class="qm-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg></span>
        <span class="qm-label">무료상담</span>
      </a>
      <a class="qm-btn qm-kakao" href="https://pf.kakao.com/_BDanX/chat" target="_blank" rel="noopener" aria-label="카카오톡 문의">
        <span class="qm-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3C6.48 3 2 6.58 2 11c0 2.86 1.87 5.37 4.68 6.79-.2.75-.73 2.73-.84 3.15-.13.52.19.51.4.37.16-.11 2.6-1.77 3.66-2.49.68.1 1.38.15 2.1.15 5.52 0 10-3.58 10-8s-4.48-8-10-8z"/></svg></span>
        <span class="qm-label">카톡문의</span>
      </a>
      <button type="button" class="qm-btn qm-top" aria-label="맨 위로 이동">
        <span class="qm-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 19V5M5 12l7-7 7 7"/></svg></span>
      </button>
    `;
    document.body.appendChild(menu);

    const topBtn = $('.qm-top', menu);
    topBtn.addEventListener('click', () => scrollTo({ top: 0, behavior: 'smooth' }));
    addEventListener('scroll', () => {
      topBtn.classList.toggle('show', scrollY > 400);
    }, { passive: true });
  }
})();

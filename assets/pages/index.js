/* ============================================================
   Kitt — index (Home) page scripts
   Services carousel + Process step fill-line.
   ============================================================ */
(() => {

  /* ---------- Services carousel ---------- */
  const track   = document.getElementById('servicesTrack');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const dotsEl  = document.getElementById('progressDots');
  if (track && prevBtn && nextBtn && dotsEl) {
    const cards = track.querySelectorAll('.svc-card');
    const total = cards.length;
    let pos = 0;

    const perView = () => (innerWidth <= 900 ? 1 : 2);
    const maxPos  = () => total - perView();

    const rebuildDots = () => {
      const max = maxPos();
      dotsEl.innerHTML = '';
      for (let i = 0; i <= max; i++) {
        const d = document.createElement('div');
        d.className = 'd' + (i === pos ? ' active' : '');
        d.addEventListener('click', () => goTo(i));
        dotsEl.appendChild(d);
      }
    };

    const update = () => {
      const cardWidth = cards[0].getBoundingClientRect().width;
      const gap = 24;
      const offset = pos * (cardWidth + gap);
      track.style.transform = `translateX(-${offset}px)`;
      dotsEl.querySelectorAll('.d').forEach((d, i) => d.classList.toggle('active', i === pos));
      prevBtn.disabled = pos === 0;
      nextBtn.disabled = pos >= maxPos();
    };

    const goTo = (i) => {
      pos = Math.max(0, Math.min(i, maxPos()));
      update();
    };

    prevBtn.addEventListener('click', () => goTo(pos - 1));
    nextBtn.addEventListener('click', () => goTo(pos + 1));

    // Mouse drag
    let dragStart = null, dragX = 0;
    const wrap = track.parentElement;
    wrap.addEventListener('mousedown', (e) => { dragStart = e.clientX; dragX = 0; });
    wrap.addEventListener('mousemove', (e) => {
      if (dragStart !== null) dragX = e.clientX - dragStart;
    });
    const endDrag = () => {
      if (dragStart === null) return;
      if (Math.abs(dragX) > 60) goTo(pos + (dragX < 0 ? 1 : -1));
      dragStart = null; dragX = 0;
    };
    wrap.addEventListener('mouseup', endDrag);
    wrap.addEventListener('mouseleave', endDrag);

    // Touch swipe
    let touchStart = null;
    wrap.addEventListener('touchstart', (e) => { touchStart = e.touches[0].clientX; }, { passive: true });
    wrap.addEventListener('touchend',   (e) => {
      if (touchStart === null) return;
      const dx = e.changedTouches[0].clientX - touchStart;
      if (Math.abs(dx) > 60) goTo(pos + (dx < 0 ? 1 : -1));
      touchStart = null;
    }, { passive: true });

    addEventListener('resize', () => {
      const max = maxPos();
      if (pos > max) pos = max;
      rebuildDots();
      update();
    });

    rebuildDots();
    update();
  }

  /* ---------- Process: filling line on scroll ---------- */
  const processSteps = document.getElementById('processSteps');
  const processFill  = document.getElementById('processFill');
  if (processSteps && processFill) {
    const stepEls = processSteps.querySelectorAll('.step');
    const updateProcess = () => {
      const rect = processSteps.getBoundingClientRect();
      const total = rect.height;
      const viewportH = innerHeight;
      // 0 when top reaches 70% of viewport, 1 when bottom reaches 30% of viewport
      const startTrigger = viewportH * 0.7;
      const endTrigger   = viewportH * 0.3;
      const startY = rect.top - startTrigger;
      const span = total + (startTrigger - endTrigger);
      const progress = Math.max(0, Math.min(1, -startY / span));
      processFill.style.height = (progress * total) + 'px';

      stepEls.forEach((step) => {
        const stepRect = step.getBoundingClientRect();
        const stepCenter = (stepRect.top - rect.top) + 14;
        step.classList.toggle('reached', (progress * total) >= stepCenter);
      });
    };
    addEventListener('scroll', updateProcess, { passive: true });
    addEventListener('resize', updateProcess);
    updateProcess();
  }

  /* ---------- Contact form submit ---------- */
  const contactForm = document.getElementById('contactForm');
  const formStatus = document.getElementById('formStatus');
  if (contactForm) {
    const API_BASE = 'https://workkit-production.up.railway.app';
    const submitBtn = contactForm.querySelector('button[type="submit"]');
    const setStatus = (msg, kind) => {
      if (!formStatus) return;
      formStatus.textContent = msg;
      formStatus.className = 'form-status full' + (kind ? ' is-' + kind : '');
    };
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!contactForm.reportValidity()) return;
      const data = Object.fromEntries(new FormData(contactForm).entries());
      submitBtn.disabled = true;
      setStatus('전송 중…', 'pending');
      try {
        const res = await fetch(API_BASE + '/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (res.ok) {
          /* Meta Pixel Lead — 접수 성공 시점에만 발생 (개인정보는 전송하지 않음) */
          if (typeof window.fbq === 'function') {
            window.fbq('track', 'Lead', {
              content_name: '홈페이지 문의폼',
              content_category: data.inquiryType || '기타',
              source_url: location.pathname,
            });
          }
          contactForm.reset();
          setStatus('문의가 접수되었습니다. 빠르게 연락드리겠습니다.', 'success');
        } else if (res.status === 429) {
          setStatus('요청이 많습니다. 잠시 후 다시 시도해주세요.', 'error');
        } else {
          setStatus('전송에 실패했습니다. 잠시 후 다시 시도하거나 partner@kitt.ai.kr 로 연락주세요.', 'error');
        }
      } catch (err) {
        setStatus('네트워크 오류로 전송하지 못했습니다. partner@kitt.ai.kr 로 연락주세요.', 'error');
      } finally {
        submitBtn.disabled = false;
      }
    });
  }
})();

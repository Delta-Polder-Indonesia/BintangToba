  (function () {
    var header = document.querySelector('[data-site-header]');
    var btn = document.querySelector('[data-site-header-menu]');
    var panel = document.getElementById('site-header-nav-panel');
    if (!header || !btn || !panel) return;
    var mobile = window.matchMedia('(max-width: 760px)');

    function setOpen(open, restoreFocus) {
      open = mobile.matches && open;
      header.setAttribute('data-nav-open', String(open));
      btn.setAttribute('aria-expanded', String(open));
      btn.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
      if (restoreFocus) btn.focus();
      panel.inert = mobile.matches && !open;
    }

    setOpen(false);
    btn.addEventListener('click', function () {
      var open = header.getAttribute('data-nav-open') === 'true';
      setOpen(!open);
    });

    panel.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        setOpen(false, mobile.matches);
      });
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && header.getAttribute('data-nav-open') === 'true') {
        event.preventDefault();
        setOpen(false, true);
      }
    });

    document.addEventListener('pointerdown', function (event) {
      if (header.getAttribute('data-nav-open') === 'true' && !header.contains(event.target)) {
        setOpen(false, panel.contains(document.activeElement));
      }
    });

    header.addEventListener('focusout', function (event) {
      if (header.getAttribute('data-nav-open') === 'true' && !header.contains(event.relatedTarget)) {
        setOpen(false);
      }
    });

    mobile.addEventListener('change', function () {
      setOpen(false, mobile.matches && panel.contains(document.activeElement));
    });
  })();



    // Copy buttons on rendered code blocks
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-copy]');
      if (!btn) return;
      const text = btn.getAttribute('data-copy');
      if (!text) return;
      navigator.clipboard.writeText(text).then(() => {
        btn.dispatchEvent(new CustomEvent('copy-success', { bubbles: true, detail: { text } }));
        btn.classList.add('is-copied');
        setTimeout(() => btn.classList.remove('is-copied'), 1500);
      }).catch(() => {});
    });

    // Mobile sidebar toggle (shown on narrow viewports, hidden on desktop).
    document.addEventListener('click', (e) => {
      const toggle = e.target.closest('.skills-sidebar-toggle');
      if (!toggle) return;
      const expanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!expanded));
    });

    // Compare three eras and the model habits illustrated by each.
    document.addEventListener('click', (e) => {
      const tab = e.target.closest('.slop-era-tab');
      if (!tab) return;
      const era = tab.getAttribute('data-era');
      document.querySelectorAll('.slop-era-tab').forEach(t => {
        t.classList.toggle('is-active', t === tab);
        t.setAttribute('aria-selected', String(t === tab));
        t.tabIndex = t === tab ? 0 : -1;
      });
      document.querySelectorAll('.slop-era-frame').forEach(f => {
        f.style.display = f.getAttribute('data-era') === era ? '' : 'none';
      });
      const title = document.querySelector('.visual-mode-preview-title[data-title-2022]');
      if (title) title.textContent = title.getAttribute('data-title-' + era);
    });

    document.addEventListener('keydown', (e) => {
      const tab = e.target.closest('.slop-era-tab');
      if (!tab || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
      e.preventDefault();
      const tabs = Array.from(document.querySelectorAll('.slop-era-tab'));
      const i = tabs.indexOf(tab);
      const next = e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 :
        (i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length;
      tabs[next].click();
      tabs[next].focus();
    });

    // Before/after split-compare: drag on touch, hover OR drag on mouse.
    // Pointer events attach to the padded .split-comparison wrapper so
    // there is a ~20px invisible buffer around the visible box. The
    // divider only snaps back when the pointer leaves that outer buffer.
    (function initSplitCompare() {
      const wrappers = document.querySelectorAll('.split-comparison');
      if (wrappers.length === 0) return;
      const hasHover = matchMedia('(hover: hover)').matches;
      const DEFAULT_POSITION = 50;

      for (const wrapper of wrappers) {
        const container = wrapper.querySelector('.split-container');
        const splitAfter = wrapper.querySelector('.split-after');
        const splitDivider = wrapper.querySelector('.split-divider');
        if (!container || !splitAfter || !splitDivider) continue;

        const tanAngle = Math.tan(10 * Math.PI / 180);
        let skewOffset = 8;
        const recalcSkew = () => {
          const r = container.getBoundingClientRect();
          if (r.width > 0 && r.height > 0) {
            skewOffset = 50 * r.height * tanAngle / r.width;
          }
        };
        recalcSkew();
        window.addEventListener('resize', recalcSkew, { passive: true });

        let targetX = DEFAULT_POSITION;
        let currentX = DEFAULT_POSITION;
        let rafId = null;

        const paint = (pct) => {
          const x = Math.max(-skewOffset, Math.min(100 + skewOffset, pct));
          splitAfter.style.clipPath =
            `polygon(${x + skewOffset}% 0%, 100% 0%, 100% 100%, ${x - skewOffset}% 100%)`;
          splitDivider.style.left = `${x}%`;
        };

        const step = () => {
          currentX += (targetX - currentX) * 0.2;
          if (Math.abs(targetX - currentX) < 0.1) {
            currentX = targetX;
            rafId = null;
          } else {
            rafId = requestAnimationFrame(step);
          }
          paint(currentX);
        };

        const setTarget = (pct) => {
          targetX = pct;
          if (rafId === null) rafId = requestAnimationFrame(step);
        };

        paint(DEFAULT_POSITION);

        // Percentage is always relative to the VISIBLE .split-container,
        // not the padded .split-comparison wrapper. The pointer event
        // target is the wrapper but the clip-path math uses the inner box.
        const pctFromClientX = (clientX) => {
          const rect = container.getBoundingClientRect();
          return ((clientX - rect.left) / rect.width) * 100;
        };

        let hovering = false;
        let dragging = false;

        wrapper.addEventListener('pointerenter', (e) => {
          if (hasHover && e.pointerType === 'mouse') {
            hovering = true;
          }
        });

        wrapper.addEventListener('pointerdown', (e) => {
          dragging = true;
          wrapper.setPointerCapture(e.pointerId);
          setTarget(pctFromClientX(e.clientX));
        });

        wrapper.addEventListener('pointermove', (e) => {
          if (dragging || hovering) {
            setTarget(pctFromClientX(e.clientX));
          }
        });

        const endDrag = (e) => {
          if (dragging) {
            dragging = false;
            try { wrapper.releasePointerCapture(e.pointerId); } catch {}
          }
        };

        wrapper.addEventListener('pointerup', endDrag);
        wrapper.addEventListener('pointercancel', endDrag);

        wrapper.addEventListener('pointerleave', (e) => {
          endDrag(e);
          if (hovering) {
            hovering = false;
            setTarget(DEFAULT_POSITION);
          }
        });
      }
    })();
  
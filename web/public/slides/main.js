(function () {
    const stage = document.querySelector('deck-stage');
    const btnRail = document.getElementById('ctrl-rail');
    const lblRail = document.getElementById('ctrl-rail-label');
    const btnFs = document.getElementById('ctrl-fs');
    const lblFs = document.getElementById('ctrl-fs-label');
    if (!stage) return;

    const replayFlowAnimation = () => {
        const active = stage.querySelector('[data-deck-active]');
        if (!active) return;
        const label = active.getAttribute('data-label') || '';
        const isFlowSlide = ['06 Arquitectura MCP', '08 MCP Server', '10 MCP Client', '11 MCP Client flujo', '15 Arquitectura WebMCP'].includes(label);
        const flowFrame = active.querySelector('.mcp-diagram-slide, .client-flow-slide, .webmcp-architecture-slide');
        if (!flowFrame) return;
        flowFrame.classList.remove('flow-reveal');
        if (!isFlowSlide) return;
        void flowFrame.offsetWidth;
        flowFrame.classList.add('flow-reveal');
    };
    stage.addEventListener('slidechange', replayFlowAnimation);
    requestAnimationFrame(replayFlowAnimation);

    // ── Rail toggle ────────────────────────────────────────
    const RAIL_KEY = 'deck.userRailHidden';
    let railHidden = false;
    try { railHidden = localStorage.getItem(RAIL_KEY) === '1'; } catch (e) { }

    const applyRail = () => {
        if (railHidden) {
            stage.setAttribute('no-rail', '');
            btnRail.setAttribute('data-active', '');
            lblRail.textContent = 'Mostrar panel';
        } else {
            stage.removeAttribute('no-rail');
            btnRail.removeAttribute('data-active');
            lblRail.textContent = 'Ocultar panel';
        }
    };
    applyRail();

    const mobile = window.matchMedia('(max-width: 640px)');
    if (mobile.matches) lblRail.textContent = 'Abrir panel';
    const controls = document.getElementById('deck-controls');
    const btnMenu = document.getElementById('ctrl-menu');
    const panel = document.getElementById('mobile-panel');
    const panelList = document.getElementById('mobile-panel-list');
    const slideButtons = [...stage.querySelectorAll('section[data-label]')].map((section, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = section.dataset.label;
        button.addEventListener('click', () => {
            stage.goTo(index);
            closePanel();
        });
        panelList.append(button);
        return button;
    });
    const closeMenu = () => {
        controls.removeAttribute('data-open');
        btnMenu.setAttribute('aria-expanded', 'false');
        btnMenu.setAttribute('aria-label', 'Abrir menú');
    };
    const closePanel = () => {
        panel.hidden = true;
        btnMenu.focus();
    };
    const updateMobileNav = () => {
        const activeIndex = [...stage.querySelectorAll('section[data-label]')].findIndex((section) => section.hasAttribute('data-deck-active'));
        slideButtons.forEach((button, index) => {
            if (index === activeIndex) button.setAttribute('aria-current', 'page');
            else button.removeAttribute('aria-current');
        });
    };
    stage.addEventListener('slidechange', updateMobileNav);
    updateMobileNav();
    btnMenu.addEventListener('click', () => {
        const open = !controls.hasAttribute('data-open');
        controls.toggleAttribute('data-open', open);
        btnMenu.setAttribute('aria-expanded', String(open));
        btnMenu.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    });
    document.getElementById('mobile-panel-close').addEventListener('click', closePanel);
    document.getElementById('mobile-panel-backdrop').addEventListener('click', closePanel);
    document.addEventListener('keydown', (event) => {
        if (event.key !== 'Escape') return;
        if (!panel.hidden) closePanel();
        else closeMenu();
    });
    mobile.addEventListener('change', () => {
        closeMenu();
        if (mobile.matches) lblRail.textContent = 'Abrir panel';
        else { panel.hidden = true; applyRail(); }
    });

    btnRail.addEventListener('click', () => {
        if (mobile.matches) {
            closeMenu();
            panel.hidden = false;
            updateMobileNav();
            document.getElementById('mobile-panel-close').focus();
            return;
        }
        railHidden = !railHidden;
        try { localStorage.setItem(RAIL_KEY, railHidden ? '1' : '0'); } catch (e) { }
        applyRail();
    });

    // ── Light mode toggle ──────────────────────────────────
    const THEME_KEY = 'deck.lightMode';
    const btnTheme = document.getElementById('ctrl-theme');
    const lblTheme = document.getElementById('ctrl-theme-label');
    const themeIcon = document.getElementById('ctrl-theme-icon');
    const requestedTheme = new URLSearchParams(location.search).get('theme');
    let lightMode = requestedTheme === 'light';
    try {
        if (!requestedTheme) lightMode = localStorage.getItem(THEME_KEY) === '1';
    } catch (e) { }

    const applyTheme = () => {
        if (lightMode) {
            document.documentElement.classList.add('light-mode');
            btnTheme.setAttribute('data-active', '');
            lblTheme.textContent = 'Modo oscuro';
            themeIcon.innerHTML = '<path d="M20 15.2A8.5 8.5 0 0 1 8.8 4 8.5 8.5 0 1 0 20 15.2Z" />';
        } else {
            document.documentElement.classList.remove('light-mode');
            btnTheme.removeAttribute('data-active');
            lblTheme.textContent = 'Modo claro';
            themeIcon.innerHTML = '<circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />';
        }
    };
    applyTheme();

    btnTheme.addEventListener('click', () => {
        lightMode = !lightMode;
        try { localStorage.setItem(THEME_KEY, lightMode ? '1' : '0'); } catch (e) { }
        applyTheme();
    });

    const toolDetails = {
        change_color: 'Contrato: <code>hex: string</code> · Resultado: el producto cambia de color en la UI.',
        focus_view: 'Contrato: <code>target: product</code> · Resultado: la cámara enfoca el producto elegido.',
        add_to_cart: 'Contrato: <code>product_id, quantity</code> · Resultado: prepara el carrito; el checkout requiere confirmación.',
    };
    document.querySelectorAll('.tool-trigger').forEach((button) => {
        button.addEventListener('click', () => {
            document.querySelectorAll('.tool-trigger').forEach((item) => item.removeAttribute('data-active'));
            button.setAttribute('data-active', '');
            const detail = document.getElementById('tool-detail');
            if (detail) detail.innerHTML = `<strong>${button.dataset.tool}()</strong> · ${toolDetails[button.dataset.tool]}`;
        });
    });

    // ── Fullscreen toggle ──────────────────────────────────
    const isFs = () => !!(document.fullscreenElement || document.webkitFullscreenElement);

    const updateFs = () => {
        if (isFs()) {
            btnFs.setAttribute('data-active', '');
            lblFs.textContent = 'Salir';
        } else {
            btnFs.removeAttribute('data-active');
            lblFs.textContent = 'Pantalla completa';
        }
    };

    btnFs.addEventListener('click', async () => {
        try {
            if (isFs()) {
                await (document.exitFullscreen?.() || document.webkitExitFullscreen?.());
            } else {
                const el = document.documentElement;
                await (el.requestFullscreen?.() || el.webkitRequestFullscreen?.());
            }
        } catch (e) { /* user gesture / iframe perms */ }
    });

    document.addEventListener('fullscreenchange', updateFs);
    document.addEventListener('webkitfullscreenchange', updateFs);

    // ── Keyboard shortcuts ─────────────────────────────────
    document.addEventListener('keydown', (e) => {
        if (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
        if (e.metaKey || e.ctrlKey || e.altKey) return;
        if (e.key === 's' || e.key === 'S') { btnRail.click(); }
        if (e.key === 'f' || e.key === 'F') { btnFs.click(); }
        if (e.key === 'l' || e.key === 'L') { btnTheme.click(); }
    });
})();

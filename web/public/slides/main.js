(function () {
    const stage = document.querySelector('deck-stage');
    const btnRail = document.getElementById('ctrl-rail');
    const lblRail = document.getElementById('ctrl-rail-label');
    const btnFs = document.getElementById('ctrl-fs');
    const lblFs = document.getElementById('ctrl-fs-label');
    if (!stage) return;

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

    btnRail.addEventListener('click', () => {
        railHidden = !railHidden;
        try { localStorage.setItem(RAIL_KEY, railHidden ? '1' : '0'); } catch (e) { }
        applyRail();
    });

    // ── Light mode toggle ──────────────────────────────────
    const THEME_KEY = 'deck.lightMode';
    const btnTheme = document.getElementById('ctrl-theme');
    const lblTheme = document.getElementById('ctrl-theme-label');
    const themeIcon = document.getElementById('ctrl-theme-icon');
    let lightMode = false;
    try { lightMode = localStorage.getItem(THEME_KEY) === '1'; } catch (e) { }

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

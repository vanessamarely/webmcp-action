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
    let lightMode = false;
    try { lightMode = localStorage.getItem(THEME_KEY) === '1'; } catch (e) { }

    const applyTheme = () => {
        if (lightMode) {
            document.documentElement.classList.add('light-mode');
            btnTheme.setAttribute('data-active', '');
            lblTheme.textContent = 'Modo oscuro';
        } else {
            document.documentElement.classList.remove('light-mode');
            btnTheme.removeAttribute('data-active');
            lblTheme.textContent = 'Modo claro';
        }
    };
    applyTheme();

    btnTheme.addEventListener('click', () => {
        lightMode = !lightMode;
        try { localStorage.setItem(THEME_KEY, lightMode ? '1' : '0'); } catch (e) { }
        applyTheme();
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

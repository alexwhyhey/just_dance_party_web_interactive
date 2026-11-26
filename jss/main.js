"use strict";
const TOTAL = 20;
const KEY = "dance-and-sing-visited-v1";
const EXTENSIONS = ["mp4", "webm", "mov", "m4v"];
let fallback = { dance: [], karaoke: [] };
function getVisited() {
    try {
        const value = localStorage.getItem(KEY);
        if (!value) return fallback;
        const data = JSON.parse(value);
        fallback = { dance: Array.isArray(data.dance) ? data.dance : [], karaoke: Array.isArray(data.karaoke) ? data.karaoke : [] };
    } catch (_) { /* Storage can be unavailable in private/restricted mode. */ }
    return fallback;
}
function markVisited(type, number) {
    const data = getVisited();
    if (!data[type].includes(number)) data[type].push(number);
    fallback = data;
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (_) { }
}
function renderGrids() {
    const visited = getVisited();
    document.querySelectorAll('[data-grid]').forEach(grid => {
        const type = grid.dataset.grid;
        grid.replaceChildren();
        for (let n = 1; n <= TOTAL; n++) {
            const link = document.createElement('a');
            const selected = visited[type].includes(n);
            link.href = `templates/${type === 'dance' ? 'dance_movies' : 'karaoke_movies'}.html?number=${n}`;
            link.className = 'number-button' + (selected ? ' is-visited' : '');
            link.textContent = n;
            link.setAttribute('aria-label', `${type === 'dance' ? 'Танец' : 'Песня'} ${n}${selected ? ' — уже выбирали' : ''}`);
            link.addEventListener('click', () => markVisited(type, n));
            grid.appendChild(link);
        }
        const progress = document.querySelector(`[data-progress="${type}"]`);
        if (progress) progress.textContent = `${visited[type].length} / ${TOTAL}`;
    });
}
function setupPlayer() {
    const type = document.body.dataset.player;
    if (!['dance', 'karaoke'].includes(type)) return;
    const video = document.querySelector('#video-player');
    const message = document.querySelector('#video-message');
    const messageText = document.querySelector('#video-message-text');
    const raw = new URLSearchParams(location.search).get('number');
    const n = Number(raw);
    function error(text) { video.hidden = true; messageText.textContent = text; message.hidden = false; }
    if (!raw || !/^\d+$/.test(raw) || !Number.isInteger(n) || n < 1 || n > TOTAL) {
        error('Номер не указан или указан неверно. Вернитесь на главную и выберите номер от 1 до 20.'); return;
    }
    document.querySelector('[data-track-number]').textContent = String(n).padStart(2, '0');
    document.title = `${type === 'dance' ? 'Танец' : 'Песня'} ${n} — Пой! Танцуй!`;
    markVisited(type, n);
    if (type === "karaoke" && (n === 5 || n === 20 | n == 8)) showChinaCelebration();
    const folder = type === 'dance' ? 'dances' : 'karaoke';
    let index = 0;
    function tryNext() {
        if (index >= EXTENSIONS.length) { error(`Проверьте наличие файла media/${folder}/${type}_${n} с расширением ${EXTENSIONS.join(', ')} и поддержку кодека браузером.`); return; }
        video.src = `../media/${folder}/${type}_${n}.${EXTENSIONS[index++]}`;
        video.load();
    }
    video.addEventListener('error', tryNext);
    tryNext();
}
document.addEventListener('DOMContentLoaded', () => { renderGrids(); setupPlayer(); });
window.addEventListener('pageshow', renderGrids);
window.addEventListener('storage', event => { if (event.key === KEY) renderGrids(); });

/* Главная: ставим шапку по вертикали ровно посередине между верхом страницы и началом блока «Выбирай своё». */
function centerHeaderAboveBlock() {
    const header = document.querySelector('body:not(.player-page) .header');
    const block = document.querySelector('.section-heading');
    if (!header || !block) return;
    header.style.setProperty('--header-shift', '0px');
    const h = header.getBoundingClientRect();
    const blockTop = block.getBoundingClientRect().top + window.scrollY;
    const shift = blockTop / 2 - (h.top + window.scrollY + h.height / 2);
    header.style.setProperty('--header-shift', `${Math.max(shift, 0)}px`);
}
window.addEventListener('load', centerHeaderAboveBlock);
window.addEventListener('resize', centerHeaderAboveBlock);
window.addEventListener('pageshow', centerHeaderAboveBlock);
document.addEventListener('DOMContentLoaded', centerHeaderAboveBlock);

// Сброс всех отметок песен и танцев.
document.querySelector('.reset-visited')?.addEventListener('click', () => {
    fallback = { dance: [], karaoke: [] };
    try { localStorage.removeItem(KEY); } catch (_) { }
    renderGrids();
});

// Праздничная анимация только на страницах песен № 17 и № 18.
function showChinaCelebration() {
    const overlay = document.createElement('div');
    overlay.className = 'china-celebration';
    overlay.setAttribute('aria-hidden', 'true');
    const banner = document.createElement('div');
    banner.className = 'china-banner';
    const bannerText = document.createElement('span');
    bannerText.textContent = '我们爱你们！';
    banner.appendChild(bannerText);
    overlay.appendChild(banner);
    const stickers = [
        `<svg viewBox="0 0 48 64" xmlns="http://www.w3.org/2000/svg"><path d="M24 2v6M24 53v9m-5-5 5 5 5-5" fill="none" stroke="#a53729" stroke-width="3" stroke-linecap="round"/><rect x="14" y="7" width="20" height="5" rx="2" fill="#d49c31"/><ellipse cx="24" cy="30" rx="19" ry="21" fill="#e43b37" stroke="#922c29" stroke-width="2"/><path d="M24 10c-9 7-9 32 0 40M24 10c9 7 9 32 0 40M7 30h34" fill="none" stroke="#f6aa65" stroke-width="2"/><rect x="15" y="49" width="18" height="5" rx="2" fill="#d49c31"/></svg>`,
        `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="10" width="44" height="44" rx="3" transform="rotate(45 32 32)" fill="#d82932" stroke="#a87624" stroke-width="3"/><text x="32" y="43" text-anchor="middle" font-family="serif" font-weight="bold" font-size="34" fill="#ffdb73">福</text></svg>`,
        `<svg viewBox="0 0 70 44" xmlns="http://www.w3.org/2000/svg"><path d="M48 22 65 7l-3 15 3 15-17-15" fill="#f3533e" stroke="#a43d2e" stroke-width="2"/><path d="M5 22C13 4 38 3 54 22 38 41 13 40 5 22Z" fill="#fff4db" stroke="#a43d2e" stroke-width="2"/><path d="M21 8c7 0 12 5 13 12-8 2-15 1-20-3M37 23c7-2 11 2 13 5-3 4-9 7-15 7-3-4-2-8 2-12" fill="#ef5542"/><circle cx="14" cy="20" r="2" fill="#241d28"/><path d="M26 7l6-5 6 6M28 37l5 5 7-5" fill="#f2a352" stroke="#a43d2e" stroke-width="2"/></svg>`
    ];
    const canvas = document.createElement('canvas');
    canvas.className = 'china-canvas';
    overlay.prepend(canvas);
    document.body.appendChild(overlay);

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        window.setTimeout(() => overlay.remove(), 5500);
        return;
    }

    // Три картинки загружаются один раз: один canvas вместо 800 SVG-элементов.
    const images = stickers.map(svg => {
        const image = new Image();
        image.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
        return image;
    });
    const ctx = canvas.getContext('2d');
    const items = Array.from({ length: 800 }, () => ({
        x: Math.random(),
        size: 24 + Math.random() * 35,
        delay: Math.random() * 1.6,
        duration: 2.6 + Math.random() * 1.5,
        image: Math.floor(Math.random() * images.length)
    }));
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);
    let start;
    function frame(time) {
        if (!start) start = time;
        const elapsed = (time - start) / 1000;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (const item of items) {
            const progress = (elapsed - item.delay) / item.duration;
            if (progress < 0 || progress > 1) continue;
            const image = images[item.image];
            if (!image.complete || !image.naturalWidth) continue;
            // Каждый предмет появляется над верхней границей, а не в середине.
            const y = -item.size + progress * (canvas.height + item.size * 2);
            ctx.drawImage(image, item.x * canvas.width, y, item.size, item.size);
        }
        if (elapsed < 5.5) requestAnimationFrame(frame);
        else { window.removeEventListener('resize', resize); overlay.remove(); }
    }
    requestAnimationFrame(frame);
}

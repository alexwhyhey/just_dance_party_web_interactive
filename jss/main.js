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

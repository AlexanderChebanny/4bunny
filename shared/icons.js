// Линейные иконки 24x24, цвет берётся из currentColor.

const s = (body) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;

window.ICONS = {
  instagram: s(
    `<rect x="3" y="3" width="18" height="18" rx="5.5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.4" cy="6.6" r=".9" fill="currentColor" stroke="none"/>`
  ),
  // Самолётик Telegram из Phosphor Icons (MIT): своя сетка 256, толщина линии под остальные иконки
  telegram: `<svg viewBox="0 0 256 256" fill="none" stroke="currentColor" stroke-width="16" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M88 134.87 178.26 214a8 8 0 0 0 13.09-4.21L232 33.22a1 1 0 0 0-1.34-1.15L28 111.38a6.23 6.23 0 0 0 1 11.92Z"/><path d="M88 134.87 231.41 32.09"/><path d="m132.37 173.78-30.61 31.76A8 8 0 0 1 88 200v-65.13"/></svg>`,
  whatsapp: s(
    `<path d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.6-1.2A9 9 0 1 0 12 3z"/><path d="M9 8.6c.5-.5 1.1-.4 1.3 0l.7 1.6c.1.3 0 .5-.2.7l-.5.5c.6 1.3 1.6 2.3 2.9 2.9l.5-.5c.2-.2.4-.3.7-.2l1.6.7c.4.2.5.8 0 1.3-.6.6-1.6.9-2.6.5-2.2-.8-4-2.6-4.8-4.8-.4-1-.1-2 .4-2.7z" fill="currentColor" stroke="none"/>`
  ),
  soundcloud: s(
    `<path d="M11 9.6V17h7.4a3.2 3.2 0 0 0 .5-6.4A5 5 0 0 0 11 9.6z"/><path d="M3 13.5V17M5.6 11.8V17M8.3 10.6V17"/>`
  ),
  linkedin: s(
    `<rect x="3" y="3" width="18" height="18" rx="4"/><path d="M8 10.5V17M8 7.4v.1M11.6 17v-6.5M11.6 13.4c0-1.7 1-2.9 2.5-2.9s2.4 1.1 2.4 2.9V17"/>`
  ),
  // Фирменный глиф Instagram, монохромный: чёрный на белой плашке
  instagramBrand: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect width="24" height="24" rx="6.5" fill="#fff"/><g fill="none" stroke="#000" stroke-width="1.9"><rect x="4.6" y="4.6" width="14.8" height="14.8" rx="4.4"/><circle cx="12" cy="12" r="3.6"/></g><circle cx="16.3" cy="7.7" r="1.05" fill="#000"/></svg>`,
  // Фирменный логотип: зелёный круг с тёмными дугами
  spotifyBrand: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="#1ED760"/><path d="M6.6 9.2c3.6-1.1 7.7-.8 11 1.1M7.4 12.5c3-.8 6.2-.5 8.7 1M8.2 15.6c2.2-.6 4.5-.4 6.4.7" fill="none" stroke="#000" stroke-width="1.9" stroke-linecap="round"/></svg>`,
  arrow: s(`<path d="M7 17 17 7M8.5 7H17v8.5"/>`),
};

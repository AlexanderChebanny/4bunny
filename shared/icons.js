// Линейные иконки 24x24, цвет берётся из currentColor.

const s = (body) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;

window.ICONS = {
  instagram: s(
    `<rect x="3" y="3" width="18" height="18" rx="5.5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.4" cy="6.6" r=".9" fill="currentColor" stroke="none"/>`
  ),
  telegram: s(`<path d="M21.5 3.5 2.5 11 9 13.5l10-7-8 8.5v5.5l3.2-3.7 3.8 2.7z"/>`),
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
  // Логотип Notion, как у оригинала: чёрная «N» на белом листе с чёрной рамкой
  notionBrand: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect width="24" height="24" rx="6.5" fill="#fff"/><path d="M6.2 5.4 15.6 4.7c.5 0 .9.1 1.2.4l2.1 1.5c.3.2.4.4.4.8v10.9c0 .7-.3 1.1-1.1 1.2l-10 .6c-.5 0-.8-.1-1.1-.5l-1.6-2.1c-.3-.4-.4-.7-.4-1.1V6.6c0-.6.3-1.1 1.1-1.2z" fill="#fff" stroke="#000" stroke-width="1.3" stroke-linejoin="round"/><path d="M8.6 8.3v8.4M8.6 8.4l6.2 8.3M14.8 8.1v8.6" fill="none" stroke="#000" stroke-width="1.6" stroke-linecap="round"/></svg>`,
  // Фирменный логотип: зелёный круг с тёмными дугами
  spotifyBrand: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="#1ED760"/><path d="M6.6 9.2c3.6-1.1 7.7-.8 11 1.1M7.4 12.5c3-.8 6.2-.5 8.7 1M8.2 15.6c2.2-.6 4.5-.4 6.4.7" fill="none" stroke="#000" stroke-width="1.9" stroke-linecap="round"/></svg>`,
  arrow: s(`<path d="M7 17 17 7M8.5 7H17v8.5"/>`),
};

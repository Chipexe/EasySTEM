const paths = {
 home: '<path d="m3 11 9-8 9 8M5 10v10h5v-6h4v6h5V10"/>',
 book: '<path d="M12 5v16M3 4c4-1 6 0 9 2 3-2 5-3 9-2v15c-4-1-6 0-9 2-3-2-5-3-9-2z"/>',
 trophy: '<path d="M7 3h10v6a5 5 0 0 1-10 0zM7 5H3v3a4 4 0 0 0 4 4m10-7h4v3a4 4 0 0 1-4 4M12 14v6m-5 1h10"/>',
 bot: '<rect x="3" y="7" width="18" height="14" rx="5"/><path d="M12 3v4M8 12v2m8-2v2m-8 3c2 1 6 1 8 0M1 12v5m22-5v5"/><circle cx="12" cy="2" r="1"/>',
 code: '<path d="m7 6-6 6 6 6m10-12 6 6-6 6m-3-15-4 18"/>',
 user: '<circle cx="12" cy="7" r="4"/><path d="M4 22v-3a8 8 0 0 1 16 0v3z"/>',
 search: '<circle cx="10" cy="10" r="7"/><path d="m15 15 6 6"/>',
 plus: '<path d="M12 4v16M4 12h16"/>',
 arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
 chevron: '<path d="m6 9 6 6 6-6"/>',
 clock: '<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',
 play: '<path d="m8 4 13 8-13 8z"/>',
 send: '<path d="m22 2-7 20-4-9L2 9zM11 13 22 2"/>',
 close: '<path d="m6 6 12 12M6 18 18 6"/>',
 eye: '<path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/>',
 save: '<path d="M4 3h13l4 4v14H3V3h1zm3 0v6h10V3M7 21v-8h10v8"/>',
 folder: '<path d="M2 20V5h8l2 3h10l-3 12z"/>',
 trash: '<path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7"/>',
 menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
 lock: '<rect x="4" y="10" width="16" height="12" rx="3"/><path d="M7 10V7a5 5 0 0 1 10 0v3M12 15v3"/>',
 grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>'
};
export const icon = (name, cls = '') => `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.code}</svg>`;

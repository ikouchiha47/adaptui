export const THEMES = {
  aurora: {
    name: 'Aurora',
    bg: '#071521',
    accent: '#6ee7b7',
    muted: '#b2c6d3',
    text: '#ffffff',
    planets: {
      travel: ['#64d3ff', '#3fbaff'],
      local: ['#7bffc8', '#3ef5aa'],
      research: ['#8ab4ff', '#4f7cff'],
      quick: ['#ff90d0', '#ff5ca8'],
    },
    cardBg: 'rgba(255,255,255,0.08)',
  },
  solar: {
    name: 'Solar Forge',
    bg: '#181512',
    accent: '#ffb34f',
    muted: '#d3c2aa',
    text: '#ffffff',
    planets: {
      travel: ['#ff8c3a', '#ff6a00'],
      local: ['#ffd364', '#ffae00'],
      research: ['#ffe69c', '#ffd862'],
      quick: ['#fca5a5', '#f87171'],
    },
    cardBg: 'rgba(255,255,255,0.06)',
  },
} as const;

export type ThemeKey = keyof typeof THEMES;
export type Theme = typeof THEMES[ThemeKey];

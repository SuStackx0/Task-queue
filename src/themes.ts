export interface ThemeVars {
  bg: string
  glass: string
  glassStrong: string
  glassBorder: string
  ink: string
  inkSoft: string
  inkDim: string
  neonCyan: string
  neonPink: string
  neonPurple: string
  neonLime: string
  neonOrange: string
  tagWork: string
  tagStudy: string
  tagTask: string
  shadow: string
}

export interface Theme {
  id: string
  name: string
  swatch: [string, string, string]
  vars: ThemeVars
}

export const THEMES: Theme[] = [
  {
    id: 'nebula',
    name: 'Nebula',
    swatch: ['#b24bff', '#27f5e8', '#ff3fd0'],
    vars: {
      bg: '#0a0514',
      glass: 'rgba(255, 255, 255, 0.06)',
      glassStrong: 'rgba(255, 255, 255, 0.1)',
      glassBorder: 'rgba(255, 255, 255, 0.16)',
      ink: '#f3eefc',
      inkSoft: 'rgba(243, 238, 252, 0.6)',
      inkDim: 'rgba(243, 238, 252, 0.38)',
      neonCyan: '#27f5e8',
      neonPink: '#ff3fd0',
      neonPurple: '#b24bff',
      neonLime: '#d4ff3f',
      neonOrange: '#ff9a3f',
      tagWork: '#4df0ff',
      tagStudy: '#d4ff3f',
      tagTask: '#ff3fd0',
      shadow: 'rgba(0, 0, 0, 0.6)',
    },
  },
  {
    id: 'sunset',
    name: 'Sunset Pop',
    swatch: ['#ff5f5f', '#ffd23f', '#ff2e8d'],
    vars: {
      bg: '#1f0a12',
      glass: 'rgba(255, 220, 200, 0.06)',
      glassStrong: 'rgba(255, 220, 200, 0.12)',
      glassBorder: 'rgba(255, 200, 170, 0.22)',
      ink: '#fff3e9',
      inkSoft: 'rgba(255, 243, 233, 0.62)',
      inkDim: 'rgba(255, 243, 233, 0.4)',
      neonCyan: '#ff9a3f',
      neonPink: '#ff2e8d',
      neonPurple: '#ff5f5f',
      neonLime: '#ffd23f',
      neonOrange: '#ff6b3d',
      tagWork: '#ff9a3f',
      tagStudy: '#ffd23f',
      tagTask: '#ff2e8d',
      shadow: 'rgba(40, 0, 10, 0.55)',
    },
  },
  {
    id: 'matrix',
    name: 'Matrix',
    swatch: ['#00e6a0', '#39ff8f', '#c8ff3f'],
    vars: {
      bg: '#040805',
      glass: 'rgba(80, 255, 140, 0.05)',
      glassStrong: 'rgba(80, 255, 140, 0.1)',
      glassBorder: 'rgba(80, 255, 140, 0.24)',
      ink: '#d8ffe0',
      inkSoft: 'rgba(216, 255, 224, 0.6)',
      inkDim: 'rgba(216, 255, 224, 0.36)',
      neonCyan: '#39ff8f',
      neonPink: '#9dff6b',
      neonPurple: '#00e6a0',
      neonLime: '#c8ff3f',
      neonOrange: '#5bffb0',
      tagWork: '#39ff8f',
      tagStudy: '#c8ff3f',
      tagTask: '#00e6a0',
      shadow: 'rgba(0, 20, 8, 0.6)',
    },
  },
  {
    id: 'bubblegum',
    name: 'Bubblegum',
    swatch: ['#b48cff', '#5ad1ff', '#ff7ad1'],
    vars: {
      bg: '#fff0fa',
      glass: 'rgba(255, 255, 255, 0.5)',
      glassStrong: 'rgba(255, 255, 255, 0.72)',
      glassBorder: 'rgba(140, 60, 160, 0.18)',
      ink: '#2a1030',
      inkSoft: 'rgba(42, 16, 48, 0.62)',
      inkDim: 'rgba(42, 16, 48, 0.4)',
      neonCyan: '#5ad1ff',
      neonPink: '#ff7ad1',
      neonPurple: '#b48cff',
      neonLime: '#9dffa0',
      neonOrange: '#ffb37a',
      tagWork: '#5ad1ff',
      tagStudy: '#9dffa0',
      tagTask: '#ff7ad1',
      shadow: 'rgba(170, 100, 200, 0.25)',
    },
  },
  {
    id: 'mono',
    name: 'Mono Ice',
    swatch: ['#4da8ff', '#aee0ff', '#ffffff'],
    vars: {
      bg: '#0b0d10',
      glass: 'rgba(255, 255, 255, 0.05)',
      glassStrong: 'rgba(255, 255, 255, 0.09)',
      glassBorder: 'rgba(255, 255, 255, 0.16)',
      ink: '#eef2f5',
      inkSoft: 'rgba(238, 242, 245, 0.6)',
      inkDim: 'rgba(238, 242, 245, 0.36)',
      neonCyan: '#4da8ff',
      neonPink: '#aee0ff',
      neonPurple: '#7fb8ff',
      neonLime: '#ffffff',
      neonOrange: '#c8d8ff',
      tagWork: '#4da8ff',
      tagStudy: '#ffffff',
      tagTask: '#aee0ff',
      shadow: 'rgba(0, 0, 0, 0.65)',
    },
  },
]

const VAR_MAP: Record<keyof ThemeVars, string> = {
  bg: '--bg',
  glass: '--glass',
  glassStrong: '--glass-strong',
  glassBorder: '--glass-border',
  ink: '--ink',
  inkSoft: '--ink-soft',
  inkDim: '--ink-dim',
  neonCyan: '--neon-cyan',
  neonPink: '--neon-pink',
  neonPurple: '--neon-purple',
  neonLime: '--neon-lime',
  neonOrange: '--neon-orange',
  tagWork: '--tag-work',
  tagStudy: '--tag-study',
  tagTask: '--tag-task',
  shadow: '--shadow-color',
}

const STORAGE_KEY = 'sq-theme'

export function applyTheme(theme: Theme) {
  const root = document.documentElement
  for (const key of Object.keys(theme.vars) as (keyof ThemeVars)[]) {
    root.style.setProperty(VAR_MAP[key], theme.vars[key])
  }
  root.dataset.theme = theme.id
  localStorage.setItem(STORAGE_KEY, theme.id)
}

export function loadStoredTheme(): Theme {
  try {
    const id = localStorage.getItem(STORAGE_KEY)
    return THEMES.find((t) => t.id === id) || THEMES[0]
  } catch {
    return THEMES[0]
  }
}

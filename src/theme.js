// theme.js — EDITH-inspired dark glass aesthetic

export const Colors = {
  // Backgrounds
  bg:         '#0A0A0F',
  bgDeep:     '#050508',
  bgCard:     'rgba(255,255,255,0.04)',
  bgCardHover:'rgba(255,255,255,0.07)',
  bgInput:    'rgba(255,255,255,0.06)',
  bgGlass:    'rgba(20,20,35,0.8)',

  // Primary — EDITH teal/cyan
  primary:    '#00E5CC',
  primaryDim: 'rgba(0,229,204,0.15)',
  primaryGlow:'rgba(0,229,204,0.3)',

  // Secondary accent
  accent:     '#7B61FF',
  accentDim:  'rgba(123,97,255,0.15)',

  // Semantic
  green:      '#00E5A0',
  amber:      '#FFB800',
  coral:      '#FF5E5E',
  blue:       '#4DA6FF',
  pink:       '#FF61DC',
  purple:     '#9B6DFF',

  // Text
  textPrimary:  '#FFFFFF',
  textSecondary:'rgba(255,255,255,0.55)',
  textMuted:    'rgba(255,255,255,0.25)',

  // Borders
  border:     'rgba(255,255,255,0.08)',
  borderGlow: 'rgba(0,229,204,0.3)',
};

export const Spacing = { xs:4, sm:8, md:16, lg:24, xl:32, xxl:48 };
export const Radius  = { sm:8, md:12, lg:16, xl:20, xxl:28, full:999 };

export const Typography = {
  h1:      { fontSize: 32, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -1 },
  h2:      { fontSize: 24, fontWeight: '700', color: Colors.textPrimary, letterSpacing: -0.5 },
  h3:      { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  body:    { fontSize: 15, fontWeight: '400', color: Colors.textPrimary, lineHeight: 22 },
  caption: { fontSize: 12, fontWeight: '500', color: Colors.textSecondary, letterSpacing: 0.3 },
  label:   { fontSize: 11, fontWeight: '700', color: Colors.textMuted, letterSpacing: 1.2, textTransform: 'uppercase' },
  mono:    { fontSize: 13, fontWeight: '600', color: Colors.primary, fontVariant: ['tabular-nums'] },
};

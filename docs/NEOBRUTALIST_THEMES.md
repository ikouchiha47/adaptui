# Neobrutalist Themes

## Overview
Added 3 neobrutalist theme variants to complement the existing Aurora and Solar Forge themes. These themes feature bold colors, thick black borders, hard shadows, and zero border radius for that classic brutalist aesthetic.

## New Themes

### 1. Neo Brutal (Classic)
- **Background**: Cream (`#FFF8E7`)
- **Accent**: Black
- **Colors**: Red, Cyan, Purple, Yellow
- **Style**: Classic neobrutalism with high contrast

### 2. Brutal Pink
- **Background**: Light Pink (`#FFF0F5`)
- **Accent**: Black
- **Colors**: Hot pink, plum, orchid, light pink
- **Style**: Feminine brutalist aesthetic

### 3. Brutal Mint
- **Background**: Mint Cream (`#F0FFF4`)
- **Accent**: Black
- **Colors**: Emerald, green, mint shades
- **Style**: Fresh, nature-inspired brutalism

## Theme Properties

All brutal themes include:
- `borderWidth: 3` - Thick black borders
- `shadowOffset: { x: 4, y: 4 }` - Hard drop shadows (no blur)
- `borderRadius: 0` - Sharp corners everywhere
- `cardBg: '#FFFFFF'` - Solid white cards
- `shadowOpacity: 1` - Full opacity shadows
- `shadowRadius: 0` - No shadow blur

## Components Updated

### CentralOrb
- Detects brutal mode via `borderWidth > 2`
- Switches from circle to square
- Uses hard shadows instead of glows
- Black borders instead of colored borders

### Planet
- Rounded squares instead of circles in brutal mode
- 3px black borders
- Hard 4x4 shadows
- Black text for better contrast

### ThemePicker
- Square buttons in brutal mode
- Black borders on dropdown
- Visual separators between options
- Checkmark for selected theme

## Usage

Themes automatically appear in the theme picker dropdown. No code changes needed - just select from the picker!

```typescript
// Themes are in src/theme/orbitalThemes.ts
export const THEMES = {
  aurora: { ... },
  solar: { ... },
  brutal: { ... },      // New!
  brutalPink: { ... },  // New!
  brutalGreen: { ... }, // New!
}
```

## Backward Compatibility

All existing themes (Aurora, Solar Forge) have been updated with default values:
- `borderWidth: 1`
- `shadowOffset: { x: 0, y: 4 }`

This ensures they continue to work exactly as before while supporting the new brutal styling system.

## Design Philosophy

Neobrutalism is characterized by:
- **Bold colors** - High saturation, high contrast
- **Thick borders** - Usually black, 2-4px
- **Hard shadows** - Offset shadows with no blur
- **No gradients** - Flat colors only
- **Sharp corners** - Zero border radius
- **Playful** - Fun, energetic, unapologetic

Perfect for apps that want to stand out and make a statement!

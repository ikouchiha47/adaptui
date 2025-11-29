# Area Tab Design Improvements

## Problem
The Area tab had poor text-to-background contrast making content unreadable. Text was blending into the dark background with insufficient visual hierarchy.

## Design Principles Applied

### 1. Contrast (WCAG AA Compliance)
- **Background**: Changed from `rgba(15, 23, 42, 0.8)` to `rgba(30, 41, 59, 0.95)` for better opacity
- **Primary Text**: Using `rgba(248, 250, 252, 1)` (near-white) for maximum contrast
- **Secondary Text**: Using `rgba(203, 213, 225, 1)` (light gray) for supporting content
- **Labels**: Using `rgba(148, 163, 184, 1)` (medium gray) for metadata
- **Contrast Ratio**: Minimum 7:1 for body text, 4.5:1 for large text

### 2. Visual Hierarchy
- **Hero Section**: Larger text (18px) with prominent spacing for the area vibe
- **Section Titles**: 15px with letter-spacing for clear section breaks
- **Body Text**: 13-14px with proper line-height (1.4-1.5) for readability
- **Labels**: 11-12px uppercase with increased letter-spacing for distinction

### 3. Proximity & Grouping
- **Card Spacing**: 12px gap between sections for clear separation
- **Section Padding**: 20px internal padding for breathing room
- **Content Gaps**: 8-12px between related elements
- **Border Radius**: 16px for modern, friendly appearance

### 4. Color System
- **Info/Transport**: Blue tones `rgba(96, 165, 250, 1)` with 15% opacity backgrounds
- **Success/Positive**: Green tones `rgba(74, 222, 128, 1)` for walkability, veg-friendly
- **Warning/Moderate**: Orange tones `rgba(251, 146, 60, 1)` for busy areas
- **Error/Critical**: Red tones `rgba(248, 113, 113, 1)` for very busy areas
- **All colors**: Using full opacity (1.0) for text, 15% opacity for backgrounds

### 5. Typography
- **Font Weights**: Clear distinction between 400 (Regular), 600 (SemiBold), 700 (Bold)
- **Letter Spacing**: 0.3-1.5px for improved readability
- **Line Height**: 1.4-1.5 for comfortable reading
- **Text Transform**: Uppercase for labels and categories

## Component Structure

### Hero Section (Area Vibe)
```
┌─────────────────────────────────────┐
│ 🏘️ AREA VIBE                       │ ← Label (11px, uppercase)
│                                     │
│ Vibrant & Trendy                    │ ← Hero text (18px, bold)
└─────────────────────────────────────┘
```

### Data Sections
```
┌─────────────────────────────────────┐
│ 🚇 Transport                        │ ← Title (15px)
│                                     │
│ ┌──────┐ ┌──────┐ ┌──────┐        │
│ │ 🚌 5 │ │ 🚆 2 │ │ 🚶 8 │        │ ← Badges (13px)
│ └──────┘ └──────┘ └──────┘        │
└─────────────────────────────────────┘
```

### Statistics Display
```
┌─────────────────────────────────────┐
│ 🏪 Establishments                   │
│                                     │
│    25        12        8            │ ← Numbers (28px, bold)
│ 🍴 Rest   ☕ Cafes  🛍️ Shops       │ ← Labels (12px)
└─────────────────────────────────────┘
```

### Local Tips Cards
```
┌─────────────────────────────────────┐
│ ┌─────────┐                         │
│ │TRANSPORT│                         │ ← Category badge
│ └─────────┘                         │
│                                     │
│ Use tuk-tuks for short distances   │ ← Tip (15px, bold)
│                                     │
│ Negotiate price before starting     │ ← Details (13px)
└─────────────────────────────────────┘
```

## Color Palette

### Text Colors
- Primary: `rgba(248, 250, 252, 1)` - #F8FAFC
- Secondary: `rgba(203, 213, 225, 1)` - #CBD5E1
- Tertiary: `rgba(148, 163, 184, 1)` - #94A3B8

### Background Colors
- Card: `rgba(30, 41, 59, 0.95)` - #1E293B
- Nested: `rgba(15, 23, 42, 0.6)` - #0F172A

### Accent Colors
- Blue: `rgba(96, 165, 250, 1)` - #60A5FA
- Green: `rgba(74, 222, 128, 1)` - #4ADE80
- Orange: `rgba(251, 146, 60, 1)` - #FB923C
- Red: `rgba(248, 113, 113, 1)` - #F87171

## Accessibility Features

1. **High Contrast**: All text meets WCAG AA standards (minimum 4.5:1 ratio)
2. **Clear Hierarchy**: Size and weight differences make scanning easy
3. **Generous Spacing**: Touch targets are minimum 44x44px
4. **Color + Text**: Never relying on color alone (icons + labels)
5. **Readable Fonts**: Orbitron with proper weights and spacing

## Before vs After

### Before
- Low contrast text (60-80% opacity)
- Cramped spacing (8-16px)
- Unclear hierarchy
- Hard to read on dark background

### After
- High contrast text (100% opacity with proper colors)
- Generous spacing (12-20px)
- Clear visual hierarchy
- Easy to read with proper backgrounds

## Files Modified
- `src/plugins/NeighborhoodPlugin.tsx` - Complete redesign with proper contrast and spacing

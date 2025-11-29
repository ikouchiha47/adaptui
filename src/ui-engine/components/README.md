# Component Renderers

This directory contains modular component renderers extracted from the original monolithic `ComponentRenderer.tsx`.

## Structure

```
components/
├── README.md                    # This file
├── index.ts                     # Exports all renderers
├── styleUtils.ts                # Style conversion utilities
├── PhotoGridVariant.tsx         # Photo grid layouts
├── CardRenderer.tsx             # Card component (destination & highlight cards)
├── ChipGroupRenderer.tsx        # Chip group component
├── ButtonRenderer.tsx           # Button component
├── InputRenderer.tsx            # Input component
├── ListRenderer.tsx             # List component
└── SimpleRenderers.tsx          # Simple components (text, image, badge, stack, etc.)
```

## Component Breakdown

### CardRenderer.tsx (~400 lines)
- Handles both destination cards and individual highlight cards
- Includes photo grids, badges, ratings, pricing
- Most complex renderer with nested components

### ChipGroupRenderer.tsx (~80 lines)
- Renders chip groups with selection states
- Handles haptic feedback
- Supports icons and badges

### ButtonRenderer.tsx (~60 lines)
- Button rendering with loading states
- Icon positioning (left/right)
- Disabled states

### InputRenderer.tsx (~50 lines)
- Text input with icon support
- Placeholder and styling

### ListRenderer.tsx (~40 lines)
- FlatList wrapper
- Loading states
- Empty state messages

### SimpleRenderers.tsx (~150 lines)
- TextRenderer
- ImageRenderer
- BadgeRenderer
- StackRenderer
- PhotoGridRenderer
- TransportTicketsRenderer

### PhotoGridVariant.tsx (~150 lines)
- Photo grid layouts (hero-left, hero-right, equal-row)
- Handles photo overflow indicators
- Responsive layouts

### styleUtils.ts (~120 lines)
- `convertLayoutToStyle()` - Converts UIComponent layout to RN styles
- `convertStyleToRN()` - Converts UIComponent style to RN styles
- `convertTypographyToStyle()` - Converts typography config to RN styles

## Usage

### Using ModularComponentRenderer

```tsx
import { ModularComponentRenderer } from '../ui-engine/ModularComponentRenderer';

<ModularComponentRenderer 
  schema={uiSchema} 
  onAction={(actionId, params) => {
    console.log('Action:', actionId, params);
  }}
/>
```

### Using Individual Renderers

```tsx
import { CardRenderer, ButtonRenderer } from '../ui-engine/components';

<CardRenderer 
  component={cardComponent}
  theme={theme}
  onPress={handlePress}
  combinedStyle={styles}
/>
```

## Benefits of Modular Structure

1. **Maintainability**: Each component type is in its own file
2. **Testability**: Easy to test individual renderers
3. **Reusability**: Components can be imported independently
4. **Performance**: Smaller files load faster
5. **Collaboration**: Multiple developers can work on different renderers
6. **Code Organization**: Clear separation of concerns

## Migration

The original `ComponentRenderer.tsx` is still available and working. The new `ModularComponentRenderer.tsx` uses the same API and is a drop-in replacement.

To migrate:
```tsx
// Old
import { ComponentRenderer } from '../ui-engine/ComponentRenderer';

// New
import { ModularComponentRenderer } from '../ui-engine/ModularComponentRenderer';
```

Both implementations are functionally identical.

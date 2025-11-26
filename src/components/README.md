# AdaptUI Components

## Component Library

### GlassCard
A theme-aware card component that automatically adapts between glassmorphism and neo-brutal styles.

**Usage:**
```tsx
import { GlassCard } from '@/components/GlassCard';

<GlassCard delay={200}>
  <Text>Your content here</Text>
</GlassCard>
```

**Props:**
- `children: ReactNode` - Content to render inside the card
- `style?: ViewStyle` - Additional custom styles
- `delay?: number` - Animation entrance delay in milliseconds (default: 0)

**Behavior:**
- **Glass theme:** Renders with BlurView, transparent background, subtle border
- **Brutal theme:** Renders with solid background, thick border, hard shadow
- **Animation:** Enters with FadeInDown spring animation

---

### ThemeToggle
A button that toggles between glassmorphism and neo-brutal themes.

**Usage:**
```tsx
import { ThemeToggle } from '@/components/ThemeToggle';

<ThemeToggle />
```

**Features:**
- Animated rotation on toggle (180° spin)
- Haptic feedback on press
- Theme-aware styling
- Icon changes: ✨ (glass) → ⚡ (brutal)

**No props required** - fully self-contained

---

### ComponentRenderer
Renders dynamic UI components from LLM responses.

**Usage:**
```tsx
import ComponentRenderer from '@/components/ComponentRenderer';

<ComponentRenderer 
  component={uiComponent}
  onComponentInteraction={handleInteraction}
/>
```

**Supported Component Types:**
- `text` - Text display with variants (title, subtitle, body, caption)
- `button` - Interactive buttons (primary, secondary, outline)
- `card` - Content cards with image, title, subtitle, actions
- `list` - Scrollable lists with items
- `image` - Image display with resize modes
- `input` - Text input fields (single/multiline)
- `webview` - Web content placeholder

---

## Creating New Components

### Theme-Aware Component Template

```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface MyComponentProps {
  title: string;
  delay?: number;
}

export const MyComponent: React.FC<MyComponentProps> = ({ 
  title, 
  delay = 0 
}) => {
  const { theme, themeType } = useTheme();

  return (
    <Animated.View
      entering={FadeInDown.delay(delay).springify()}
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: themeType === 'glass' ? theme.borderRadius.md : 0,
          borderWidth: themeType === 'brutal' ? 3 : 1,
        }
      ]}
    >
      <Text style={[styles.title, { color: theme.colors.text }]}>
        {title}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
});
```

### Best Practices

1. **Always use theme values** - Never hardcode colors or spacing
2. **Support both themes** - Test with glass and brutal
3. **Add animations** - Use Reanimated for smooth 60fps
4. **Include haptics** - Add feedback for interactions
5. **Type everything** - Use TypeScript interfaces
6. **Document props** - Add JSDoc comments

### Animation Guidelines

```tsx
// Entrance animations
FadeIn.delay(100)                    // Simple fade
FadeInDown.delay(200).springify()    // Slide from top with spring
FadeInUp.delay(300).springify()      // Slide from bottom
SlideInRight.springify()             // Slide from right

// Interactive animations
withSpring(value)                    // Bouncy, natural
withTiming(value, { duration: 200 }) // Linear, controlled
withSequence(                        // Multiple steps
  withTiming(0.95, { duration: 100 }),
  withSpring(1)
)
```

### Haptic Feedback

```tsx
import * as Haptics from 'expo-haptics';

// Light tap
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

// Medium tap
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

// Heavy tap
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

// Success/Error
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
```

---

## Component Checklist

When creating a new component:

- [ ] Uses `useTheme()` hook
- [ ] Supports both glass and brutal themes
- [ ] Has entrance animation
- [ ] Includes haptic feedback (if interactive)
- [ ] TypeScript interfaces defined
- [ ] Props documented
- [ ] Tested in both themes
- [ ] Responsive to different screen sizes
- [ ] Accessible (proper labels, contrast)
- [ ] Performance optimized (memoized if needed)

---

## Examples

### Glass Theme Card
```
┌─────────────────────────────┐
│ [Frosted glass with blur]   │
│                             │
│  Title Text                 │
│  Subtitle text              │
│                             │
│  [Button]                   │
└─────────────────────────────┘
  Subtle shadow, rounded
```

### Brutal Theme Card
```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ [Solid white background]  ┃
┃                           ┃
┃  Title Text               ┃
┃  Subtitle text            ┃
┃                           ┃
┃  [Button]                 ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
  Hard shadow, sharp edges
```

---

## Future Components

Planned components for Phase 2:

- **MapView** - Interactive maps with pins
- **Timeline** - Itinerary timeline component
- **WeatherCard** - Weather forecast display
- **ComparisonTable** - Side-by-side comparisons
- **Chart** - Data visualization
- **Toast** - Success/error notifications
- **Modal** - Overlay dialogs
- **BottomSheet** - Slide-up panels
- **Skeleton** - Loading placeholders
- **Avatar** - User profile images

---

Built with React Native + Reanimated 🚀

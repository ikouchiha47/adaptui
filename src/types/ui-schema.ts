// UI Schema types for dynamic UI generation

export interface DeviceContext {
  dimensions: {
    width: number;
    height: number;
    scale: number;
  };
  platform: 'ios' | 'android' | 'web';
  orientation: 'portrait' | 'landscape';
  safeArea: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}

export type ComponentType =
  | 'text'
  | 'input'
  | 'button'
  | 'card'
  | 'list'
  | 'image'
  | 'chip-group'
  | 'filter'
  | 'map'
  | 'chart'
  | 'stack'
  | 'grid';

export interface ColorScheme {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  error: string;
  success: string;
  warning: string;
}

export interface TypographyStyle {
  fontSize: number;
  fontWeight?: '300' | '400' | '500' | '600' | '700' | '800' | '900';
  fontFamily?: string;
  lineHeight?: number;
  letterSpacing?: number;
  textAlign?: 'left' | 'center' | 'right';
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
}

export interface SpacingConfig {
  padding?: number | {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
    horizontal?: number;
    vertical?: number;
  };
  margin?: number | {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
    horizontal?: number;
    vertical?: number;
  };
  gap?: number; // For flex/grid children spacing
}

export interface BorderStyle {
  width?: number;
  color?: string;
  radius?: number | {
    topLeft?: number;
    topRight?: number;
    bottomLeft?: number;
    bottomRight?: number;
  };
  style?: 'solid' | 'dashed' | 'dotted';
}

export interface ShadowStyle {
  color?: string;
  offset?: { x: number; y: number };
  blur?: number;
  spread?: number;
  opacity?: number;
}

export interface LayoutConfig {
  // Dimensions
  width?: number | 'auto' | 'fill' | string; // string for percentages like "50%"
  height?: number | 'auto' | 'fill' | string;
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  aspectRatio?: number;

  // Flexbox
  flex?: number;
  flexDirection?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  flexWrap?: 'wrap' | 'nowrap' | 'wrap-reverse';
  justifyContent?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly';
  alignItems?: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline';
  alignSelf?: 'auto' | 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline';

  // Grid (for future)
  gridColumns?: number;
  gridRows?: number;
  gridGap?: number;

  // Position
  position?: 'relative' | 'absolute' | 'fixed';
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
  zIndex?: number;

  // Spacing
  spacing?: SpacingConfig;

  // Overflow
  overflow?: 'visible' | 'hidden' | 'scroll';
}

export interface StyleConfig {
  // Colors
  backgroundColor?: string;
  color?: string; // text color
  opacity?: number;

  // Border
  border?: BorderStyle;

  // Shadow
  shadow?: ShadowStyle;

  // Typography (for text components)
  typography?: TypographyStyle;

  // Transform
  transform?: {
    scale?: number;
    rotate?: number;
    translateX?: number;
    translateY?: number;
  };
}

export interface InteractionConfig {
  onPress?: string; // Action ID
  onLongPress?: string;
  onSwipe?: {
    left?: string;
    right?: string;
    up?: string;
    down?: string;
  };
  disabled?: boolean;
  loading?: boolean;
  hapticFeedback?: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';
}

export interface AnimationConfig {
  type?: 'fade' | 'slide' | 'scale' | 'spring' | 'bounce';
  duration?: number;
  delay?: number;
  easing?: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
}

// Component-specific props
export interface TextProps {
  text: string;
  numberOfLines?: number;
  ellipsizeMode?: 'head' | 'middle' | 'tail' | 'clip';
  selectable?: boolean;
}

export interface InputProps {
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  multiline?: boolean;
  maxLength?: number;
  keyboardType?: 'default' | 'numeric' | 'email' | 'phone' | 'url';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoCorrect?: boolean;
  secureTextEntry?: boolean;
  icon?: string;
  iconPosition?: 'left' | 'right';
}

export interface ButtonProps {
  text: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'small' | 'medium' | 'large';
  icon?: string;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

export interface CardProps {
  title?: string;
  subtitle?: string;
  description?: string;
  image?: string;
  imagePosition?: 'top' | 'left' | 'right' | 'background';
  badge?: string;
  rating?: number;
  price?: string;
}

export interface ListProps {
  items: any[];
  itemLayout?: 'card' | 'row' | 'grid';
  columns?: number; // for grid layout
  separator?: boolean;
  emptyMessage?: string;
  loading?: boolean;
  onEndReached?: string; // Action for infinite scroll
}

export interface ChipGroupProps {
  options: Array<{ id: string; label: string; icon?: string }>;
  selected?: string[];
  multiSelect?: boolean;
  variant?: 'filled' | 'outlined';
}

export interface ImageProps {
  source: string;
  alt?: string;
  fit?: 'cover' | 'contain' | 'fill' | 'none';
  placeholder?: string;
  loading?: 'lazy' | 'eager';
}

export interface UIComponent {
  id: string;
  type: ComponentType;
  
  // Component-specific props
  props: TextProps | InputProps | ButtonProps | CardProps | ListProps | ChipGroupProps | ImageProps | Record<string, any>;
  
  // Layout & styling
  layout?: LayoutConfig;
  style?: StyleConfig;
  
  // Interactions
  interaction?: InteractionConfig;
  
  // Animation
  animation?: AnimationConfig;
  
  // Children for container components
  children?: UIComponent[];
  
  // Conditional rendering
  condition?: {
    field: string;
    operator: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan';
    value: any;
  };
  
  // Accessibility
  accessibility?: {
    label?: string;
    hint?: string;
    role?: string;
  };
}

export interface UIAction {
  type: 'search' | 'navigate' | 'submit' | 'filter' | 'apiCall' | 'custom';
  params: Record<string, any>;
}

export interface UISchema {
  // Metadata
  id: string;
  version: string;
  uiType: 'list' | 'form' | 'detail' | 'dashboard' | 'map' | 'custom';
  title: string;
  description?: string;
  
  // Visual theme
  theme: {
    colors: ColorScheme;
    typography: {
      heading: TypographyStyle;
      subheading: TypographyStyle;
      body: TypographyStyle;
      caption: TypographyStyle;
    };
    spacing: {
      xs: number;
      sm: number;
      md: number;
      lg: number;
      xl: number;
    };
    borderRadius: {
      sm: number;
      md: number;
      lg: number;
      full: number;
    };
  };
  
  // Layout structure
  layout: {
    type: 'stack' | 'grid' | 'tabs' | 'drawer';
    config: LayoutConfig;
  };
  
  // Components tree
  components: UIComponent[];
  
  // Actions/interactions
  actions?: Record<string, UIAction>;
  
  // Data bindings
  data?: {
    sources: Record<string, {
      type: 'api' | 'local' | 'computed';
      config: any;
    }>;
    bindings: Record<string, string>; // componentId -> data path
  };
  
  // Responsive breakpoints
  responsive?: {
    small?: Partial<UISchema>; // Overrides for small screens
    medium?: Partial<UISchema>;
    large?: Partial<UISchema>;
  };
  
  // Metadata for caching/optimization
  metadata?: {
    generatedAt: string;
    queryHash: string;
    category: string;
    tags: string[];
  };
}

export interface ResponsiveRules {
  breakpoints: {
    small: number;
    medium: number;
    large: number;
  };
  adaptations: {
    [breakpoint: string]: {
      columns?: number;
      fontSize?: number;
      spacing?: number;
    };
  };
}

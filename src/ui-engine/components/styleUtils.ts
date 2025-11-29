// Style conversion utilities
import { UIComponent } from '../../types/ui-schema';

export function convertLayoutToStyle(layout?: UIComponent['layout']): any {
  if (!layout) return {};

  const style: any = {};

  // Dimensions
  if (layout.width === 'fill') style.width = '100%';
  else if (layout.width) style.width = layout.width;
  
  if (layout.height === 'fill') style.height = '100%';
  else if (layout.height) style.height = layout.height;

  if (layout.minWidth) style.minWidth = layout.minWidth;
  if (layout.maxWidth) style.maxWidth = layout.maxWidth;
  if (layout.minHeight) style.minHeight = layout.minHeight;
  if (layout.maxHeight) style.maxHeight = layout.maxHeight;

  // Flexbox
  if (layout.flex) style.flex = layout.flex;
  if (layout.flexDirection) style.flexDirection = layout.flexDirection;
  if (layout.flexWrap) style.flexWrap = layout.flexWrap;
  if (layout.justifyContent) style.justifyContent = layout.justifyContent;
  if (layout.alignItems) style.alignItems = layout.alignItems;
  if (layout.alignSelf) style.alignSelf = layout.alignSelf;

  // Position
  if (layout.position) style.position = layout.position;
  if (layout.top !== undefined) style.top = layout.top;
  if (layout.right !== undefined) style.right = layout.right;
  if (layout.bottom !== undefined) style.bottom = layout.bottom;
  if (layout.left !== undefined) style.left = layout.left;
  if (layout.zIndex) style.zIndex = layout.zIndex;

  // Spacing
  if (layout.spacing) {
    const { padding, margin, gap } = layout.spacing;
    
    if (typeof padding === 'number') {
      style.padding = padding;
    } else if (padding) {
      if (padding.top !== undefined) style.paddingTop = padding.top;
      if (padding.right !== undefined) style.paddingRight = padding.right;
      if (padding.bottom !== undefined) style.paddingBottom = padding.bottom;
      if (padding.left !== undefined) style.paddingLeft = padding.left;
      if (padding.horizontal !== undefined) style.paddingHorizontal = padding.horizontal;
      if (padding.vertical !== undefined) style.paddingVertical = padding.vertical;
    }

    if (typeof margin === 'number') {
      style.margin = margin;
    } else if (margin) {
      if (margin.top !== undefined) style.marginTop = margin.top;
      if (margin.right !== undefined) style.marginRight = margin.right;
      if (margin.bottom !== undefined) style.marginBottom = margin.bottom;
      if (margin.left !== undefined) style.marginLeft = margin.left;
      if (margin.horizontal !== undefined) style.marginHorizontal = margin.horizontal;
      if (margin.vertical !== undefined) style.marginVertical = margin.vertical;
    }

    if (gap) style.gap = gap;
  }

  return style;
}

export function convertStyleToRN(styleConfig?: UIComponent['style']): any {
  if (!styleConfig) return {};

  const style: any = {};

  if (styleConfig.backgroundColor) style.backgroundColor = styleConfig.backgroundColor;
  if (styleConfig.color) style.color = styleConfig.color;
  if (styleConfig.opacity !== undefined) style.opacity = styleConfig.opacity;

  // Border
  if (styleConfig.border) {
    if (styleConfig.border.width) style.borderWidth = styleConfig.border.width;
    if (styleConfig.border.color) style.borderColor = styleConfig.border.color;
    if (typeof styleConfig.border.radius === 'number') {
      style.borderRadius = styleConfig.border.radius;
    } else if (styleConfig.border.radius) {
      if (styleConfig.border.radius.topLeft) style.borderTopLeftRadius = styleConfig.border.radius.topLeft;
      if (styleConfig.border.radius.topRight) style.borderTopRightRadius = styleConfig.border.radius.topRight;
      if (styleConfig.border.radius.bottomLeft) style.borderBottomLeftRadius = styleConfig.border.radius.bottomLeft;
      if (styleConfig.border.radius.bottomRight) style.borderBottomRightRadius = styleConfig.border.radius.bottomRight;
    }
  }

  // Shadow
  if (styleConfig.shadow) {
    style.shadowColor = styleConfig.shadow.color || '#000';
    style.shadowOffset = styleConfig.shadow.offset || { width: 0, height: 2 };
    style.shadowOpacity = styleConfig.shadow.opacity || 0.25;
    style.shadowRadius = styleConfig.shadow.blur || 4;
    style.elevation = styleConfig.shadow.blur || 4; // Android
  }

  return style;
}

export function convertTypographyToStyle(typography?: any): any {
  if (!typography) return {};

  return {
    fontSize: typography.fontSize,
    fontWeight: typography.fontWeight,
    fontFamily: typography.fontFamily,
    lineHeight: typography.lineHeight,
    letterSpacing: typography.letterSpacing,
    textAlign: typography.textAlign,
    textTransform: typography.textTransform,
  };
}

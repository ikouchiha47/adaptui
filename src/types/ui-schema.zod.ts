// Zod schemas for UI Schema validation and OpenAI structured outputs

import { z } from 'zod';

// Component types
export const ComponentTypeSchema = z.enum([
  'text',
  'input',
  'button',
  'card',
  'list',
  'chip-group',
  'image',
  'stack',
  'grid'
]);

// Color scheme
export const ColorSchemeSchema = z.object({
  primary: z.string(),
  secondary: z.string(),
  background: z.string(),
  surface: z.string(),
  text: z.string(),
  textSecondary: z.string(),
  border: z.string(),
  error: z.string(),
  success: z.string(),
  warning: z.string()
});

// Typography
export const TypographyStyleSchema = z.object({
  fontSize: z.number(),
  fontWeight: z.enum(['300', '400', '500', '600', '700', '800', '900']).optional(),
  lineHeight: z.number().optional()
});

// Spacing
export const SpacingSchema = z.object({
  xs: z.number(),
  sm: z.number(),
  md: z.number(),
  lg: z.number(),
  xl: z.number()
});

// Border radius
export const BorderRadiusSchema = z.object({
  sm: z.number(),
  md: z.number(),
  lg: z.number(),
  full: z.number()
});

// Theme
export const ThemeSchema = z.object({
  colors: ColorSchemeSchema,
  typography: z.object({
    heading: TypographyStyleSchema,
    subheading: TypographyStyleSchema,
    body: TypographyStyleSchema,
    caption: TypographyStyleSchema
  }),
  spacing: SpacingSchema,
  borderRadius: BorderRadiusSchema
});

// Layout config
export const LayoutConfigSchema = z.object({
  flexDirection: z.enum(['row', 'column', 'row-reverse', 'column-reverse']).optional(),
  justifyContent: z.enum(['flex-start', 'flex-end', 'center', 'space-between', 'space-around', 'space-evenly']).optional(),
  alignItems: z.enum(['flex-start', 'flex-end', 'center', 'stretch', 'baseline']).optional()
});

// Component props (simplified for schema generation)
export const ComponentPropsSchema = z.record(z.string(), z.any());

// UI Component (recursive, simplified)
const BaseComponentSchema = z.object({
  id: z.string(),
  type: ComponentTypeSchema,
  props: ComponentPropsSchema,
  layout: z.record(z.string(), z.any()).optional(),
  style: z.record(z.string(), z.any()).optional()
});

export type UIComponentSchemaType = z.infer<typeof BaseComponentSchema> & {
  children?: UIComponentSchemaType[];
};

export const UIComponentSchema: any = BaseComponentSchema.extend({
  children: z.array(z.lazy(() => UIComponentSchema)).optional()
});

// UI Schema (main schema for OpenAI)
export const UISchemaSchema = z.object({
  id: z.string(),
  version: z.string(),
  uiType: z.enum(['list', 'form', 'detail', 'dashboard', 'map', 'custom']),
  title: z.string(),
  theme: ThemeSchema.optional(),
  layout: z.object({
    type: z.enum(['stack', 'grid', 'tabs', 'drawer']),
    config: LayoutConfigSchema
  }).optional(),
  components: z.array(UIComponentSchema),
  actions: z.record(z.any(), z.any()).optional()
});

// Export types
export type UISchemaType = z.infer<typeof UISchemaSchema>;
export type ThemeType = z.infer<typeof ThemeSchema>;

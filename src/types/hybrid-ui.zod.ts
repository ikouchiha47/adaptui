import { z } from 'zod';

// Restrict to known component IDs from ComponentRegistry
export const HybridComponentIdSchema = z.enum([
  'card-travel',
  'card-restaurant',
  'card-hotel',
  'card-activity',
  'card-highlight',
  'list-travel',
  'list-grid',
  'list-carousel',
  'badge-time',
  'badge-crowd',
  'badge-weather',
  'filter-chips',
  'stack-vertical',
  'stack-horizontal',
  'photo-grid',
  'transport-tickets',
]);

export const HybridSectionSchema = z.object({
  id: z.string(),
  component: HybridComponentIdSchema,
  itemComponent: HybridComponentIdSchema.optional().nullable(),
  itemCount: z.number().optional().nullable(),
  children: z.array(z.string()).optional().nullable(),
  options: z.array(z.string()).optional().nullable(),
});

export const HybridUIStructureSchema = z.object({
  layout: z.string(),
  sections: z.array(HybridSectionSchema).min(1),
});

export type HybridUIStructure = z.infer<typeof HybridUIStructureSchema>;

// console.log(zodTextFormat(HybridUIStructureSchema, "ui_schema"))
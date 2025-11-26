// Schema Validator: Ensures UI schemas are safe and valid

import { UISchema } from '../types/ui-schema';

export class SchemaValidator {
  private validComponentTypes = [
    'text', 'input', 'button', 'card', 'list', 
    'chip-group', 'image', 'stack', 'grid', 'icon'
  ];

  validate(schema: any): UISchema {
    console.log('🔍 [SchemaValidator] Starting validation...');
    console.log('📋 [SchemaValidator] Schema ID:', schema.id);
    
    // Required fields
    if (!schema.id) throw new Error('Schema missing required field: id');
    if (!schema.version) throw new Error('Schema missing required field: version');
    if (!schema.components || !Array.isArray(schema.components)) {
      throw new Error('Schema missing required field: components (must be array)');
    }

    console.log(`📦 [SchemaValidator] Validating ${schema.components.length} components...`);

    // Validate theme
    this.validateTheme(schema.theme);

    // Validate components
    schema.components.forEach((component: any, index: number) => {
      this.validateComponent(component, `components[${index}]`);
    });

    // Validate actions
    if (schema.actions) {
      console.log(`⚡ [SchemaValidator] Validating ${Object.keys(schema.actions).length} actions...`);
      this.validateActions(schema.actions);
    }

    console.log('✅ [SchemaValidator] Validation complete');
    return schema as UISchema;
  }

  private validateTheme(theme: any) {
    if (!theme) throw new Error('Schema missing required field: theme');
    if (!theme.colors) throw new Error('Theme missing required field: colors');

    // Validate colors are valid hex or rgba
    const colorRegex = /^(#[0-9A-F]{6}|#[0-9A-F]{8}|rgba?\([^)]+\))$/i;
    Object.entries(theme.colors).forEach(([key, value]) => {
      if (typeof value === 'string' && !colorRegex.test(value)) {
        console.warn(`Invalid color format for ${key}: ${value}`);
      }
    });

    // Validate typography
    if (theme.typography) {
      Object.values(theme.typography).forEach((typo: any) => {
        if (typo.fontSize && (typo.fontSize < 8 || typo.fontSize > 100)) {
          throw new Error(`Invalid fontSize: ${typo.fontSize} (must be 8-100)`);
        }
      });
    }
  }

  private validateComponent(component: any, path: string) {
    // Required fields
    if (!component.id) throw new Error(`${path}: missing required field 'id'`);
    if (!component.type) throw new Error(`${path}: missing required field 'type'`);

    // Valid component type
    if (!this.validComponentTypes.includes(component.type)) {
      console.warn(`${path}: invalid component type '${component.type}', converting to 'text'`);
      component.type = 'text';
      if (!component.props.text) {
        component.props.text = component.type;
      }
    }

    // Validate props exist
    if (!component.props) {
      throw new Error(`${path}: missing required field 'props'`);
    }

    // Type-specific validation
    switch (component.type) {
      case 'text':
        if (!component.props.text) {
          console.warn(`${path}: text component missing 'text' prop, adding default`);
          component.props.text = 'Text';
        }
        break;

      case 'input':
        // Input is valid with just placeholder
        break;

      case 'button':
        if (!component.props.text && !component.props.icon) {
          console.warn(`${path}: button missing text/icon, adding default`);
          component.props.text = 'Button';
        }
        break;

      case 'list':
        if (!Array.isArray(component.props.items)) {
          console.warn(`${path}: list 'items' must be an array, fixing...`);
          component.props.items = [];
        }
        break;

      case 'chip-group':
        if (!Array.isArray(component.props.options)) {
          console.warn(`${path}: chip-group 'options' must be an array, fixing...`);
          component.props.options = [];
        }
        break;
    }

    // Validate layout values
    if (component.layout) {
      this.validateLayout(component.layout, path);
    }

    // Validate children recursively
    if (component.children) {
      component.children.forEach((child: any, index: number) => {
        this.validateComponent(child, `${path}.children[${index}]`);
      });
    }

    // Sanitize dangerous values
    this.sanitizeComponent(component);
  }

  private validateLayout(layout: any, path: string) {
    // Check for reasonable values
    if (layout.width && typeof layout.width === 'number' && layout.width < 0) {
      throw new Error(`${path}: width cannot be negative`);
    }
    if (layout.height && typeof layout.height === 'number' && layout.height < 0) {
      throw new Error(`${path}: height cannot be negative`);
    }
    if (layout.flex && (layout.flex < 0 || layout.flex > 100)) {
      throw new Error(`${path}: flex must be between 0 and 100`);
    }
  }

  private validateActions(actions: Record<string, any>) {
    const validActionTypes = ['search', 'navigate', 'submit', 'filter', 'apiCall', 'custom'];
    
    Object.entries(actions).forEach(([id, action]) => {
      if (!action.type) {
        console.warn(`Action '${id}' missing type, setting to 'custom'`);
        action.type = 'custom';
      }
      if (!validActionTypes.includes(action.type)) {
        console.warn(`Action '${id}' has invalid type '${action.type}', changing to 'custom'`);
        action.type = 'custom';
      }
    });
  }

  private sanitizeComponent(component: any) {
    // Remove any potentially dangerous props
    const dangerousProps = ['__proto__', 'constructor', 'prototype'];
    dangerousProps.forEach(prop => {
      if (component.props && prop in component.props) {
        delete component.props[prop];
      }
    });

    // Limit text length to prevent memory issues
    if (component.type === 'text' && component.props.text) {
      if (component.props.text.length > 10000) {
        component.props.text = component.props.text.substring(0, 10000) + '...';
      }
    }

    // Limit list items
    if (component.type === 'list' && component.props.items) {
      if (component.props.items.length > 1000) {
        component.props.items = component.props.items.slice(0, 1000);
        console.warn('List items truncated to 1000 for performance');
      }
    }
  }
}

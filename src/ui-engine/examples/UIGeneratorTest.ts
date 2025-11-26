// Test the complete UI generation flow

import { DeviceContext } from '../../types/ui-schema';
import { SchemaValidator } from '../SchemaValidator';
import { UIGenerator } from '../UIGenerator';

export async function testUIGeneration() {
  console.log('🚀 Testing UI Generation Flow...\n');

  // 1. Setup device context
  const deviceContext: DeviceContext = {
    dimensions: { width: 393, height: 852, scale: 3 },
    platform: 'ios',
    orientation: 'portrait',
    safeArea: { top: 44, bottom: 34, left: 0, right: 0 }
  };

  // 2. Create generator and validator
  const generator = new UIGenerator();
  const validator = new SchemaValidator();

  // 3. Test queries
  const testQueries = [
    'Find romantic restaurants in Paris under $50',
    'Show me nearby coffee shops',
    'Book a flight to Tokyo',
    'Create a new task list'
  ];

  for (const query of testQueries) {
    console.log(`\n📝 Query: "${query}"`);
    console.log('─'.repeat(50));

    try {
      // Generate UI schema
      console.log('⏳ Generating UI schema...');
      const schema = await generator.generateUI(query, deviceContext);
      
      console.log(`✅ Generated schema: ${schema.id}`);
      console.log(`   Type: ${schema.uiType}`);
      console.log(`   Title: ${schema.title}`);
      console.log(`   Components: ${schema.components.length}`);

      // Validate schema
      console.log('⏳ Validating schema...');
      const validSchema = validator.validate(schema);
      console.log('✅ Schema is valid!');

      // Show component breakdown
      console.log('\n📦 Components:');
      validSchema.components.forEach((comp, idx) => {
        console.log(`   ${idx + 1}. ${comp.type} (${comp.id})`);
      });

    } catch (error) {
      console.error('❌ Error:', error);
    }
  }

  console.log('\n✨ Test complete!\n');
}

// Run if executed directly
if (require.main === module) {
  testUIGeneration().catch(console.error);
}

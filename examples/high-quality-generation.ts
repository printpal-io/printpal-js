/**
 * High-Quality 3D Model Generation Example
 *
 * This example demonstrates generating high-resolution 3D models
 * using super and superplus quality levels.
 *
 * Usage:
 *   npx ts-node high-quality-generation.ts
 */

import { PrintPal, Quality, Format } from 'printpal';

const client = new PrintPal({
  apiKey: process.env.PRINTPAL_API_KEY || 'pp_live_your_api_key_here',
});

async function main() {
  console.log('PrintPal High-Quality Generation Example');
  console.log('========================================\n');

  // Check credits
  const credits = await client.getCredits();
  console.log(`Current credits: ${credits.credits}`);

  // Super quality (768 cubed resolution) - 20 credits
  console.log('\n--- Super Quality (768 cubed) ---');
  console.log('This will take approximately 3-6 minutes...\n');

  const superPath = await client.generateAndDownload(
    './my_image.png',
    './super_model.stl',
    {
      quality: Quality.SUPER,
      format: Format.STL,
      onProgress: (status) => {
        console.log(`  Status: ${status.status}`);
      },
    }
  );

  console.log(`Super model saved to: ${superPath}`);

  // SuperPlus with texture (1024 cubed) - 50 credits
  console.log('\n--- SuperPlus with Texture (1024 cubed) ---');
  console.log('This will take approximately 8-12 minutes...\n');

  const superplusPath = await client.generateAndDownload(
    './my_image.png',
    './superplus_textured.glb',
    {
      quality: Quality.SUPERPLUS_TEXTURE,
      format: Format.GLB, // GLB supports embedded textures
      onProgress: (status) => {
        console.log(`  Status: ${status.status}`);
      },
    }
  );

  console.log(`SuperPlus textured model saved to: ${superplusPath}`);

  // Final credits
  const finalCredits = await client.getCredits();
  console.log(`\nFinal credit balance: ${finalCredits.credits}`);
}

main().catch(console.error);

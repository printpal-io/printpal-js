/**
 * Basic 3D Model Generation Example
 *
 * This example demonstrates the simplest way to generate a 3D model
 * from an image using the PrintPal API.
 *
 * Usage:
 *   npx ts-node basic-generation.ts
 */

import { PrintPal, Quality, Format } from 'printpal';

// Initialize the client with your API key
const client = new PrintPal({
  apiKey: process.env.PRINTPAL_API_KEY || 'pp_live_your_api_key_here',
});

async function main() {
  console.log('PrintPal Basic Generation Example');
  console.log('==================================\n');

  // Check credits first
  const credits = await client.getCredits();
  console.log(`Current credit balance: ${credits.credits}`);

  // The simplest way: generate and download in one call
  console.log('\nGenerating 3D model from image...');

  const outputPath = await client.generateAndDownload(
    './my_image.png', // Path to your image
    './output.stl',   // Where to save the model
    {
      quality: Quality.DEFAULT, // Fast generation
      format: Format.STL,       // Best for 3D printing
      onProgress: (status) => {
        console.log(`  Status: ${status.status}`);
      },
    }
  );

  console.log(`\nModel saved to: ${outputPath}`);

  // Check remaining credits
  const remainingCredits = await client.getCredits();
  console.log(`Remaining credits: ${remainingCredits.credits}`);
}

main().catch(console.error);

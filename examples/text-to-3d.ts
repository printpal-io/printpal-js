/**
 * Text-to-3D Generation Example
 *
 * This example demonstrates generating 3D models from text prompts.
 * The API first generates an image from your text, then converts
 * that image to a 3D model.
 *
 * Note: Text-to-3D is not available for super/superplus quality levels.
 *
 * Usage:
 *   npx ts-node text-to-3d.ts
 */

import { PrintPal, Quality, Format } from 'printpal';

const client = new PrintPal({
  apiKey: process.env.PRINTPAL_API_KEY || 'pp_live_your_api_key_here',
});

async function main() {
  console.log('PrintPal Text-to-3D Example');
  console.log('===========================\n');

  // Check credits
  const credits = await client.getCredits();
  console.log(`Current credits: ${credits.credits}\n`);

  // Example prompts
  const prompts = [
    'A cute cartoon robot with big eyes',
    'A medieval castle tower',
    'A sports car',
  ];

  for (const prompt of prompts) {
    console.log(`Generating: "${prompt}"`);

    const result = await client.generateFromPrompt({
      prompt,
      quality: Quality.HIGH,
      format: Format.STL,
    });

    console.log(`  Generation started: ${result.generationUid}`);
    console.log(`  Credits used: ${result.creditsUsed}`);

    // Wait for completion
    const status = await client.waitForCompletion(result.generationUid, {
      quality: Quality.HIGH,
      onProgress: (s) => {
        process.stdout.write(`  Status: ${s.status}\r`);
      },
    });

    console.log(`  Status: ${status.status}      `);

    // Download
    const safeName = prompt.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 30);
    const outputPath = await client.download(
      result.generationUid,
      `./${safeName}.stl`
    );

    console.log(`  Saved to: ${outputPath}\n`);
  }

  // Final credits
  const finalCredits = await client.getCredits();
  console.log(`Final credit balance: ${finalCredits.credits}`);
}

main().catch(console.error);

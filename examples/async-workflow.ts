/**
 * Async Workflow Example
 *
 * This example demonstrates the full async workflow:
 * 1. Submit generation request
 * 2. Poll for status
 * 3. Download when complete
 *
 * Useful when you need more control over the process.
 *
 * Usage:
 *   npx ts-node async-workflow.ts
 */

import { PrintPal, Quality, Format, GenerationStatus } from 'printpal';

const client = new PrintPal({
  apiKey: process.env.PRINTPAL_API_KEY || 'pp_live_your_api_key_here',
});

async function main() {
  console.log('PrintPal Async Workflow Example');
  console.log('================================\n');

  // Step 1: Submit generation request
  console.log('Step 1: Submitting generation request...');

  const result = await client.generateFromImage('./my_image.png', {
    quality: Quality.HIGH,
    format: Format.GLB,
  });

  console.log(`  Generation UID: ${result.generationUid}`);
  console.log(`  Status: ${result.status}`);
  console.log(`  Credits used: ${result.creditsUsed}`);
  console.log(`  Estimated time: ${result.estimatedTimeSeconds}s`);

  // Step 2: Poll for completion
  console.log('\nStep 2: Waiting for completion...');

  const finalStatus = await client.waitForCompletion(result.generationUid, {
    pollInterval: 3000, // Check every 3 seconds
    quality: Quality.HIGH,
    onProgress: (status: GenerationStatus) => {
      const elapsed = Date.now() - Date.parse(status.createdAt || '');
      console.log(`  [${Math.round(elapsed / 1000)}s] Status: ${status.status}`);
    },
  });

  console.log(`  Completed: ${finalStatus.isCompleted}`);

  // Step 3: Download the model
  console.log('\nStep 3: Downloading model...');

  const downloadInfo = await client.getDownloadUrl(result.generationUid);
  console.log(`  Format: ${downloadInfo.format}`);
  console.log(`  URL expires in: ${downloadInfo.expiresIn}s`);

  const outputPath = await client.download(result.generationUid, './async_output.glb');
  console.log(`  Saved to: ${outputPath}`);

  console.log('\nWorkflow complete!');
}

main().catch(console.error);

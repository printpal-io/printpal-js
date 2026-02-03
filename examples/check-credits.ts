/**
 * Check Credits Example
 *
 * This example demonstrates how to check your credit balance
 * and view pricing information.
 *
 * Usage:
 *   npx ts-node check-credits.ts
 */

import { PrintPal, Quality, CREDIT_COSTS, ESTIMATED_TIMES } from 'printpal';

const client = new PrintPal({
  apiKey: process.env.PRINTPAL_API_KEY || 'pp_live_your_api_key_here',
});

async function main() {
  console.log('PrintPal Credit Information');
  console.log('===========================\n');

  // Get current balance
  const credits = await client.getCredits();
  console.log(`Current Balance: ${credits.credits} credits`);
  console.log(`Username: ${credits.username}`);
  console.log(`User ID: ${credits.userId}\n`);

  // Show what you can generate
  console.log('What you can generate with your credits:');
  console.log('-----------------------------------------');

  for (const [quality, cost] of Object.entries(CREDIT_COSTS)) {
    const count = Math.floor(credits.credits / cost);
    const time = ESTIMATED_TIMES[quality as Quality];
    console.log(`  ${quality}: ${count} models (${cost} credits each, ~${time}s)`);
  }

  // Get full pricing info from API
  console.log('\nAPI Pricing Information:');
  console.log('------------------------');

  const pricing = await client.getPricing();
  for (const [tier, info] of Object.entries(pricing.credits)) {
    console.log(`  ${tier}:`);
    console.log(`    Cost: ${info.cost} credits`);
    console.log(`    Resolution: ${info.resolution}`);
    console.log(`    Est. time: ${info.estimatedTimeSeconds}s`);
    console.log(`    ${info.description}`);
  }

  console.log('\nSupported Formats:', pricing.supportedFormats.join(', '));
  console.log('\nRate Limits:');
  console.log(`  Requests per minute: ${pricing.rateLimits.requestsPerMinute}`);
  console.log(`  Concurrent generations: ${pricing.rateLimits.concurrentGenerations}`);
}

main().catch(console.error);

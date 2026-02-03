/**
 * PrintPal JavaScript/TypeScript Client
 *
 * Official client for the PrintPal 3D Model Generation API.
 * Convert images to 3D models for 3D printing with AI.
 *
 * @packageDocumentation
 */

// Main client
export { PrintPal, PrintPalClient, printpal } from './client';

// Types
export {
  Quality,
  Format,
  CREDIT_COSTS,
  ESTIMATED_TIMES,
  GENERATION_TIMEOUTS,
  RESOLUTIONS,
} from './types';

export type {
  PrintPalConfig,
  GenerateFromImageOptions,
  GenerateFromPromptOptions,
  GenerateAndDownloadOptions,
  GenerationResult,
  GenerationStatus,
  GenerationStatusValue,
  DownloadResult,
  CreditsInfo,
  PricingInfo,
  PricingTier,
  UsageStats,
  HealthStatus,
} from './types';

// Errors
export {
  PrintPalError,
  AuthenticationError,
  InsufficientCreditsError,
  RateLimitError,
  GenerationError,
  NotFoundError,
  ValidationError,
  TimeoutError,
  NetworkError,
} from './errors';

/**
 * PrintPal API Types and Interfaces
 */

/**
 * Quality levels for 3D model generation.
 * Higher quality = more detail but longer processing time and more credits.
 */
export enum Quality {
  /** Fast generation, good for previews (256 cubed resolution) - 4 credits */
  DEFAULT = 'default',
  /** Better detail (384 cubed resolution) - 6 credits */
  HIGH = 'high',
  /** Maximum detail for standard generation (512 cubed resolution) - 8 credits */
  ULTRA = 'ultra',
  /** High-resolution geometry only (768 cubed resolution) - 20 credits */
  SUPER = 'super',
  /** High-resolution with texture (768 cubed resolution) - 40 credits */
  SUPER_TEXTURE = 'super_texture',
  /** Maximum resolution geometry only (1024 cubed resolution) - 30 credits */
  SUPERPLUS = 'superplus',
  /** Maximum resolution with texture (1024 cubed resolution) - 50 credits */
  SUPERPLUS_TEXTURE = 'superplus_texture',
}

/**
 * Output file formats for 3D models.
 */
export enum Format {
  /** Standard Triangle Language - best for 3D printing */
  STL = 'stl',
  /** GL Transmission Format - good for web/games, supports textures */
  GLB = 'glb',
  /** Wavefront OBJ - widely compatible */
  OBJ = 'obj',
  /** Polygon File Format - good for point clouds */
  PLY = 'ply',
  /** Autodesk FBX - for animation software (super/superplus only) */
  FBX = 'fbx',
}

/**
 * Generation status values.
 */
export type GenerationStatusValue = 'pending' | 'processing' | 'completed' | 'failed';

/**
 * Credit costs for each quality level.
 */
export const CREDIT_COSTS: Record<Quality, number> = {
  [Quality.DEFAULT]: 4,
  [Quality.HIGH]: 6,
  [Quality.ULTRA]: 8,
  [Quality.SUPER]: 20,
  [Quality.SUPER_TEXTURE]: 40,
  [Quality.SUPERPLUS]: 30,
  [Quality.SUPERPLUS_TEXTURE]: 50,
};

/**
 * Estimated generation times in seconds.
 */
export const ESTIMATED_TIMES: Record<Quality, number> = {
  [Quality.DEFAULT]: 20,
  [Quality.HIGH]: 30,
  [Quality.ULTRA]: 60,
  [Quality.SUPER]: 180,
  [Quality.SUPER_TEXTURE]: 360,
  [Quality.SUPERPLUS]: 240,
  [Quality.SUPERPLUS_TEXTURE]: 720,
};

/**
 * Recommended timeout values in seconds.
 */
export const GENERATION_TIMEOUTS: Record<Quality, number> = {
  [Quality.DEFAULT]: 120,        // 2 minutes
  [Quality.HIGH]: 180,           // 3 minutes
  [Quality.ULTRA]: 300,          // 5 minutes
  [Quality.SUPER]: 360,          // 6 minutes
  [Quality.SUPER_TEXTURE]: 600,  // 10 minutes
  [Quality.SUPERPLUS]: 480,      // 8 minutes
  [Quality.SUPERPLUS_TEXTURE]: 600,  // 10 minutes
};

/**
 * Resolution descriptions for each quality level.
 */
export const RESOLUTIONS: Record<Quality, string> = {
  [Quality.DEFAULT]: '256 cubed',
  [Quality.HIGH]: '384 cubed',
  [Quality.ULTRA]: '512 cubed',
  [Quality.SUPER]: '768 cubed',
  [Quality.SUPER_TEXTURE]: '768 cubed',
  [Quality.SUPERPLUS]: '1024 cubed',
  [Quality.SUPERPLUS_TEXTURE]: '1024 cubed',
};

/**
 * Options for generating a 3D model from an image.
 */
export interface GenerateFromImageOptions {
  /** Quality level for generation */
  quality?: Quality;
  /** Output format */
  format?: Format;
  /** Number of inference steps (1-50, not used for super quality) */
  numInferenceSteps?: number;
  /** Guidance scale (0.5-10.0, not used for super quality) */
  guidanceScale?: number;
  /** Octree resolution (128, 256, 512, not used for super quality) */
  octreeResolution?: number;
}

/**
 * Options for generating a 3D model from text.
 */
export interface GenerateFromPromptOptions extends GenerateFromImageOptions {
  /** Text prompt describing the 3D model to generate */
  prompt: string;
}

/**
 * Options for the generate and download convenience method.
 */
export interface GenerateAndDownloadOptions extends GenerateFromImageOptions {
  /** Polling interval in milliseconds */
  pollInterval?: number;
  /** Maximum time to wait in milliseconds */
  timeout?: number;
  /** Callback function called with status after each poll */
  onProgress?: (status: GenerationStatus) => void;
}

/**
 * Result of a generation request.
 */
export interface GenerationResult {
  /** Unique identifier for the generation */
  generationUid: string;
  /** Current status */
  status: GenerationStatusValue;
  /** Quality level used */
  quality: Quality;
  /** Output format */
  format: Format;
  /** Credits consumed */
  creditsUsed: number;
  /** Remaining credits after this generation */
  creditsRemaining: number;
  /** Estimated time in seconds */
  estimatedTimeSeconds: number;
  /** URL to check status */
  statusUrl: string;
  /** URL to download when complete */
  downloadUrl: string;
}

/**
 * Status of a generation request.
 */
export interface GenerationStatus {
  /** Unique identifier for the generation */
  generationUid: string;
  /** Current status */
  status: GenerationStatusValue;
  /** Quality level used */
  quality?: string;
  /** Output format */
  format?: string;
  /** Creation timestamp */
  createdAt?: string;
  /** Completion timestamp */
  completedAt?: string;
  /** Download URL (when completed) */
  downloadUrl?: string;
  /** Whether generation is completed */
  isCompleted: boolean;
  /** Whether generation failed */
  isFailed: boolean;
  /** Whether generation is still processing */
  isProcessing: boolean;
}

/**
 * Download result with URL and metadata.
 */
export interface DownloadResult {
  /** Unique identifier for the generation */
  generationUid: string;
  /** Pre-signed download URL */
  downloadUrl: string;
  /** Seconds until URL expires */
  expiresIn: number;
  /** File format */
  format: string;
}

/**
 * Credit balance information.
 */
export interface CreditsInfo {
  /** Current credit balance */
  credits: number;
  /** User ID */
  userId: number;
  /** Username */
  username: string;
}

/**
 * Pricing information for a quality level.
 */
export interface PricingTier {
  /** Credit cost */
  cost: number;
  /** Description */
  description: string;
  /** Resolution */
  resolution: string;
  /** Estimated time in seconds */
  estimatedTimeSeconds: number;
}

/**
 * Full pricing information.
 */
export interface PricingInfo {
  credits: Record<string, PricingTier>;
  supportedFormats: string[];
  rateLimits: {
    requestsPerMinute: number;
    concurrentGenerations: number;
  };
}

/**
 * Usage statistics for an API key.
 */
export interface UsageStats {
  apiKey: {
    name: string;
    totalRequests: number;
    creditsUsed: number;
    lastUsed: string | null;
  };
  user: {
    creditsRemaining: number;
  };
  recentRequests: Array<{
    endpoint: string;
    method: string;
    statusCode: number;
    creditsUsed: number;
    generationUid: string | null;
    timestamp: string;
  }>;
}

/**
 * API health status.
 */
export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'down';
  timestamp: string;
  version: string;
}

/**
 * Configuration options for the PrintPal client.
 */
export interface PrintPalConfig {
  /** Your PrintPal API key */
  apiKey: string;
  /** Base URL for the API (default: https://printpal.io) */
  baseUrl?: string;
  /** Request timeout in milliseconds (default: 60000) */
  timeout?: number;
}

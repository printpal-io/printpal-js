/**
 * PrintPal API Client
 *
 * Official JavaScript/TypeScript client for the PrintPal 3D Model Generation API.
 */

import {
  Quality,
  Format,
  GENERATION_TIMEOUTS,
  PrintPalConfig,
  GenerateFromImageOptions,
  GenerateFromPromptOptions,
  GenerateAndDownloadOptions,
  GenerationResult,
  GenerationStatus,
  DownloadResult,
  CreditsInfo,
  PricingInfo,
  UsageStats,
  HealthStatus,
} from './types';

import {
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

// Node.js built-in modules (for file operations)
import * as fs from 'fs';
import * as path from 'path';

const DEFAULT_BASE_URL = 'https://printpal.io';
const DEFAULT_TIMEOUT = 60000; // 60 seconds

/**
 * PrintPal API Client for 3D model generation.
 *
 * @example
 * ```typescript
 * import { PrintPal, Quality } from 'printpal';
 *
 * const client = new PrintPal({ apiKey: 'pp_live_your_key' });
 *
 * // Generate a 3D model from an image
 * const result = await client.generateFromImage('./photo.png', {
 *   quality: Quality.SUPER,
 * });
 *
 * // Wait for completion and download
 * const filePath = await client.waitAndDownload(
 *   result.generationUid,
 *   './output.stl'
 * );
 * ```
 */
export class PrintPal {
  private apiKey: string;
  private baseUrl: string;
  private timeout: number;

  /**
   * Create a new PrintPal client.
   *
   * @param config - Configuration options
   * @throws {ValidationError} If API key is not provided
   */
  constructor(config: PrintPalConfig) {
    if (!config.apiKey) {
      throw new ValidationError('API key is required');
    }

    this.apiKey = config.apiKey;
    this.baseUrl = (config.baseUrl || DEFAULT_BASE_URL).replace(/\/$/, '');
    this.timeout = config.timeout || DEFAULT_TIMEOUT;
  }

  /**
   * Make an authenticated request to the API.
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'X-API-Key': this.apiKey,
      ...((options.headers as Record<string, string>) || {}),
    };

    // Don't set Content-Type for FormData (browser will set it with boundary)
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle errors based on status code
      if (!response.ok) {
        const data = await response.json().catch(() => ({})) as Record<string, unknown>;
        this.handleErrorResponse(response.status, data);
      }

      return await response.json() as T;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof PrintPalError) {
        throw error;
      }

      if ((error as Error).name === 'AbortError') {
        throw new TimeoutError('Request timed out');
      }

      throw new NetworkError(`Network error: ${(error as Error).message}`);
    }
  }

  /**
   * Handle error responses from the API.
   */
  private handleErrorResponse(
    statusCode: number,
    data: Record<string, unknown>
  ): never {
    const message = (data.message as string) || (data.error as string) || 'Unknown error';

    switch (statusCode) {
      case 401:
        throw new AuthenticationError(message);
      case 402:
        throw new InsufficientCreditsError(
          message,
          data.credits_required as number,
          data.credits_available as number
        );
      case 404:
        throw new NotFoundError(message);
      case 429:
        throw new RateLimitError(message, data.retry_after as number);
      case 400:
        throw new ValidationError(message, data.errors as Record<string, string[]>);
      default:
        throw new PrintPalError(message, statusCode, data);
    }
  }

  // =========================================================================
  // Credit Management
  // =========================================================================

  /**
   * Get current credit balance.
   *
   * @returns Credit balance information
   *
   * @example
   * ```typescript
   * const credits = await client.getCredits();
   * console.log(`Balance: ${credits.credits} credits`);
   * ```
   */
  async getCredits(): Promise<CreditsInfo> {
    return this.request<CreditsInfo>('/api/credits');
  }

  /**
   * Get API pricing information.
   *
   * @returns Pricing for all quality levels
   *
   * @example
   * ```typescript
   * const pricing = await client.getPricing();
   * console.log(pricing.credits.super_generation.cost); // 20
   * ```
   */
  async getPricing(): Promise<PricingInfo> {
    return this.request<PricingInfo>('/api/pricing');
  }

  /**
   * Get API usage statistics.
   *
   * @returns Usage statistics for the current API key
   */
  async getUsage(): Promise<UsageStats> {
    return this.request<UsageStats>('/api/usage');
  }

  /**
   * Check API health status.
   *
   * @returns Health status (does not require authentication)
   */
  async healthCheck(): Promise<HealthStatus> {
    const url = `${this.baseUrl}/api/health`;
    const response = await fetch(url);
    return await response.json() as HealthStatus;
  }

  // =========================================================================
  // 3D Generation
  // =========================================================================

  /**
   * Generate a 3D model from an image file.
   *
   * @param imagePath - Path to the image file
   * @param options - Generation options
   * @returns Generation result with UID for tracking
   *
   * @example
   * ```typescript
   * const result = await client.generateFromImage('./photo.png', {
   *   quality: Quality.SUPER,
   *   format: Format.STL,
   * });
   * console.log(`Generation started: ${result.generationUid}`);
   * ```
   */
  async generateFromImage(
    imagePath: string,
    options: GenerateFromImageOptions = {}
  ): Promise<GenerationResult> {
    const {
      quality = Quality.DEFAULT,
      format = Format.STL,
      numInferenceSteps = 20,
      guidanceScale = 5.0,
      octreeResolution = 256,
    } = options;

    // Validate quality/format combinations
    this.validateQualityFormat(quality, format);

    // Read the image file
    const imageBuffer = fs.readFileSync(imagePath);
    const fileName = path.basename(imagePath);

    // Create form data
    const formData = new FormData();
    formData.append('image', new Blob([imageBuffer]), fileName);
    formData.append('quality', quality);
    formData.append('format', format);

    // Add generation parameters for non-super quality
    if (!this.isSuperQuality(quality)) {
      formData.append('num_inference_steps', String(numInferenceSteps));
      formData.append('guidance_scale', String(guidanceScale));
      formData.append('octree_resolution', String(octreeResolution));
    }

    const response = await this.request<{
      generation_uid: string;
      status: string;
      quality: string;
      credits_used: number;
      credits_remaining: number;
      estimated_time_seconds: number;
      status_url: string;
      download_url: string;
    }>('/api/generate', {
      method: 'POST',
      body: formData,
      headers: {}, // Let FormData set Content-Type
    });

    return {
      generationUid: response.generation_uid,
      status: response.status as GenerationResult['status'],
      quality: quality,
      format: format,
      creditsUsed: response.credits_used,
      creditsRemaining: response.credits_remaining,
      estimatedTimeSeconds: response.estimated_time_seconds,
      statusUrl: response.status_url,
      downloadUrl: response.download_url,
    };
  }

  /**
   * Generate a 3D model from an image buffer.
   *
   * @param imageBuffer - Image data as Buffer or Uint8Array
   * @param fileName - Name for the image file
   * @param options - Generation options
   * @returns Generation result with UID for tracking
   */
  async generateFromBuffer(
    imageBuffer: Buffer | Uint8Array,
    fileName: string,
    options: GenerateFromImageOptions = {}
  ): Promise<GenerationResult> {
    const {
      quality = Quality.DEFAULT,
      format = Format.STL,
      numInferenceSteps = 20,
      guidanceScale = 5.0,
      octreeResolution = 256,
    } = options;

    this.validateQualityFormat(quality, format);

    const formData = new FormData();
    formData.append('image', new Blob([imageBuffer]), fileName);
    formData.append('quality', quality);
    formData.append('format', format);

    if (!this.isSuperQuality(quality)) {
      formData.append('num_inference_steps', String(numInferenceSteps));
      formData.append('guidance_scale', String(guidanceScale));
      formData.append('octree_resolution', String(octreeResolution));
    }

    const response = await this.request<{
      generation_uid: string;
      status: string;
      quality: string;
      credits_used: number;
      credits_remaining: number;
      estimated_time_seconds: number;
      status_url: string;
      download_url: string;
    }>('/api/generate', {
      method: 'POST',
      body: formData,
      headers: {},
    });

    return {
      generationUid: response.generation_uid,
      status: response.status as GenerationResult['status'],
      quality: quality,
      format: format,
      creditsUsed: response.credits_used,
      creditsRemaining: response.credits_remaining,
      estimatedTimeSeconds: response.estimated_time_seconds,
      statusUrl: response.status_url,
      downloadUrl: response.download_url,
    };
  }

  /**
   * Generate a 3D model from a text prompt.
   *
   * Note: Text-to-3D is not available for super/superplus quality levels.
   *
   * @param options - Generation options including prompt
   * @returns Generation result with UID for tracking
   *
   * @example
   * ```typescript
   * const result = await client.generateFromPrompt({
   *   prompt: 'A cute robot character',
   *   quality: Quality.HIGH,
   *   format: Format.GLB,
   * });
   * ```
   */
  async generateFromPrompt(
    options: GenerateFromPromptOptions
  ): Promise<GenerationResult> {
    const {
      prompt,
      quality = Quality.DEFAULT,
      format = Format.STL,
      numInferenceSteps = 20,
      guidanceScale = 5.0,
      octreeResolution = 256,
    } = options;

    if (!prompt) {
      throw new ValidationError('Prompt is required');
    }

    // Super quality doesn't support text prompts
    if (this.isSuperQuality(quality)) {
      throw new ValidationError(
        'Text-to-3D is not available for super/superplus quality levels. Please use an image instead.'
      );
    }

    this.validateQualityFormat(quality, format);

    const formData = new FormData();
    formData.append('prompt', prompt);
    formData.append('quality', quality);
    formData.append('format', format);
    formData.append('num_inference_steps', String(numInferenceSteps));
    formData.append('guidance_scale', String(guidanceScale));
    formData.append('octree_resolution', String(octreeResolution));

    const response = await this.request<{
      generation_uid: string;
      status: string;
      quality: string;
      credits_used: number;
      credits_remaining: number;
      estimated_time_seconds: number;
      status_url: string;
      download_url: string;
    }>('/api/generate', {
      method: 'POST',
      body: formData,
      headers: {},
    });

    return {
      generationUid: response.generation_uid,
      status: response.status as GenerationResult['status'],
      quality: quality,
      format: format,
      creditsUsed: response.credits_used,
      creditsRemaining: response.credits_remaining,
      estimatedTimeSeconds: response.estimated_time_seconds,
      statusUrl: response.status_url,
      downloadUrl: response.download_url,
    };
  }

  // =========================================================================
  // Status and Download
  // =========================================================================

  /**
   * Get the status of a generation request.
   *
   * @param generationUid - The generation UID
   * @returns Current status of the generation
   */
  async getStatus(generationUid: string): Promise<GenerationStatus> {
    const response = await this.request<{
      generation_uid: string;
      status: string;
      quality?: string;
      format?: string;
      created_at?: string;
      completed_at?: string;
      download_url?: string;
    }>(`/api/generate/${generationUid}/status`);

    const status = response.status as GenerationStatus['status'];

    return {
      generationUid: response.generation_uid,
      status,
      quality: response.quality,
      format: response.format,
      createdAt: response.created_at,
      completedAt: response.completed_at,
      downloadUrl: response.download_url,
      isCompleted: status === 'completed',
      isFailed: status === 'failed',
      isProcessing: status === 'processing' || status === 'pending',
    };
  }

  /**
   * Get download URL for a completed generation.
   *
   * @param generationUid - The generation UID
   * @returns Download information including pre-signed URL
   */
  async getDownloadUrl(generationUid: string): Promise<DownloadResult> {
    const response = await this.request<{
      generation_uid: string;
      download_url: string;
      expires_in: number;
      format: string;
    }>(`/api/generate/${generationUid}/download`);

    return {
      generationUid: response.generation_uid,
      downloadUrl: response.download_url,
      expiresIn: response.expires_in,
      format: response.format,
    };
  }

  /**
   * Download a completed model to a file.
   *
   * @param generationUid - The generation UID
   * @param outputPath - Path to save the file (optional)
   * @returns Path to the downloaded file
   */
  async download(
    generationUid: string,
    outputPath?: string
  ): Promise<string> {
    const downloadInfo = await this.getDownloadUrl(generationUid);

    // Determine output path
    let finalPath = outputPath;
    if (!finalPath) {
      finalPath = `model_${generationUid.slice(0, 8)}.${downloadInfo.format}`;
    } else {
      // Ensure extension matches format
      const ext = path.extname(finalPath).toLowerCase().slice(1);
      if (ext && ext !== downloadInfo.format) {
        finalPath = finalPath.replace(/\.[^.]+$/, `.${downloadInfo.format}`);
      } else if (!ext) {
        finalPath = `${finalPath}.${downloadInfo.format}`;
      }
    }

    // Download the file
    const response = await fetch(downloadInfo.downloadUrl);
    if (!response.ok) {
      throw new PrintPalError(`Failed to download model: ${response.statusText}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(finalPath, buffer);

    return finalPath;
  }

  /**
   * Wait for a generation to complete.
   *
   * @param generationUid - The generation UID
   * @param options - Wait options
   * @returns Final status when completed
   */
  async waitForCompletion(
    generationUid: string,
    options: {
      pollInterval?: number;
      timeout?: number;
      onProgress?: (status: GenerationStatus) => void;
      quality?: Quality;
    } = {}
  ): Promise<GenerationStatus> {
    const {
      pollInterval = 5000,
      onProgress,
      quality,
    } = options;

    // Determine timeout based on quality
    let timeout = options.timeout;
    if (timeout === undefined) {
      if (quality) {
        timeout = GENERATION_TIMEOUTS[quality] * 1000;
      } else {
        // Try to get quality from status
        const initialStatus = await this.getStatus(generationUid);
        if (initialStatus.quality) {
          const qualityEnum = initialStatus.quality as Quality;
          timeout = (GENERATION_TIMEOUTS[qualityEnum] || 600) * 1000;
        } else {
          timeout = 600000; // 10 minutes default
        }
      }
    }

    const startTime = Date.now();

    while (true) {
      const status = await this.getStatus(generationUid);

      if (onProgress) {
        onProgress(status);
      }

      if (status.isCompleted) {
        return status;
      }

      if (status.isFailed) {
        throw new GenerationError('Generation failed', generationUid);
      }

      const elapsed = Date.now() - startTime;
      if (elapsed >= timeout) {
        throw new TimeoutError(
          `Generation did not complete within ${timeout / 1000} seconds`
        );
      }

      await this.sleep(pollInterval);
    }
  }

  /**
   * Wait for completion and download the result.
   *
   * @param generationUid - The generation UID
   * @param outputPath - Path to save the file
   * @param options - Wait options
   * @returns Path to the downloaded file
   */
  async waitAndDownload(
    generationUid: string,
    outputPath?: string,
    options: {
      pollInterval?: number;
      timeout?: number;
      onProgress?: (status: GenerationStatus) => void;
      quality?: Quality;
    } = {}
  ): Promise<string> {
    await this.waitForCompletion(generationUid, options);
    return this.download(generationUid, outputPath);
  }

  /**
   * Generate a 3D model from an image and download when complete.
   *
   * This is a convenience method that combines generateFromImage,
   * waitForCompletion, and download into a single call.
   *
   * @param imagePath - Path to the image file
   * @param outputPath - Path to save the model (optional)
   * @param options - Generation and download options
   * @returns Path to the downloaded file
   *
   * @example
   * ```typescript
   * const filePath = await client.generateAndDownload(
   *   './photo.png',
   *   './model.stl',
   *   {
   *     quality: Quality.SUPER,
   *     onProgress: (status) => console.log(status.status),
   *   }
   * );
   * ```
   */
  async generateAndDownload(
    imagePath: string,
    outputPath?: string,
    options: GenerateAndDownloadOptions = {}
  ): Promise<string> {
    const {
      quality = Quality.DEFAULT,
      format,
      pollInterval = 5000,
      timeout,
      onProgress,
      ...generateOptions
    } = options;

    // Infer format from output path if not specified
    let finalFormat = format;
    if (!finalFormat && outputPath) {
      const ext = path.extname(outputPath).toLowerCase().slice(1);
      if (['stl', 'glb', 'obj', 'ply', 'fbx'].includes(ext)) {
        finalFormat = ext as Format;
      }
    }
    if (!finalFormat) {
      finalFormat = Format.STL;
    }

    const result = await this.generateFromImage(imagePath, {
      quality,
      format: finalFormat,
      ...generateOptions,
    });

    return this.waitAndDownload(result.generationUid, outputPath, {
      pollInterval,
      timeout,
      onProgress,
      quality,
    });
  }

  // =========================================================================
  // Utility Methods
  // =========================================================================

  /**
   * Check if a quality level is a "super" tier.
   */
  private isSuperQuality(quality: Quality): boolean {
    return [
      Quality.SUPER,
      Quality.SUPER_TEXTURE,
      Quality.SUPERPLUS,
      Quality.SUPERPLUS_TEXTURE,
    ].includes(quality);
  }

  /**
   * Validate quality and format combination.
   */
  private validateQualityFormat(quality: Quality, format: Format): void {
    // Texture generation only supports GLB and OBJ
    if (
      (quality === Quality.SUPER_TEXTURE ||
        quality === Quality.SUPERPLUS_TEXTURE) &&
      ![Format.GLB, Format.OBJ].includes(format)
    ) {
      throw new ValidationError(
        `Texture generation (${quality}) only supports GLB and OBJ formats`
      );
    }

    // FBX only for super/superplus
    if (format === Format.FBX && !this.isSuperQuality(quality)) {
      throw new ValidationError('FBX format is only available for super/superplus quality levels');
    }
  }

  /**
   * Sleep for a specified duration.
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Export aliases for convenience
export const PrintPalClient = PrintPal;
export const printpal = PrintPal;

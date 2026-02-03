<p align="center">
  <img src="https://printpal.io/static/img/printpal_logo.png" alt="PrintPal Logo" width="200">
</p>

<h1 align="center">PrintPal JavaScript/TypeScript Client</h1>

<p align="center">
  <strong>Official JavaScript/TypeScript client for the PrintPal 3D Model Generation API</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/printpal"><img src="https://img.shields.io/npm/v/printpal.svg" alt="npm version"></a>
  <a href="https://www.npmjs.com/package/printpal"><img src="https://img.shields.io/npm/dm/printpal.svg" alt="npm downloads"></a>
  <a href="https://github.com/printpal-io/printpal-js/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/printpal.svg" alt="license"></a>
  <a href="https://printpal.io"><img src="https://img.shields.io/badge/API-PrintPal.io-blue" alt="PrintPal API"></a>
</p>

<p align="center">
  Convert images to 3D models for 3D printing with AI-powered generation.
</p>

---

## Why PrintPal?

- **Image to 3D** - Transform any image into a printable 3D model
- **Text to 3D** - Generate 3D models from text descriptions
- **Multiple Quality Levels** - From fast previews to ultra-high resolution
- **3D Printing Ready** - Export directly to STL, OBJ, GLB, and more
- **Texture Support** - Generate models with full color textures
- **TypeScript Native** - Full type definitions included

## Installation

```bash
npm install printpal
```

```bash
yarn add printpal
```

```bash
pnpm add printpal
```

## Quick Start

```typescript
import { PrintPal, Quality } from 'printpal';

// Initialize client
const client = new PrintPal({
  apiKey: 'pp_live_your_api_key_here',
});

// Generate a 3D model from an image (simplest method)
const outputPath = await client.generateAndDownload(
  './photo.png',
  './model.stl',
  { quality: Quality.SUPER }
);

console.log(`3D model saved to: ${outputPath}`);
```

## Getting Your API Key

1. Create an account at [printpal.io](https://printpal.io)
2. Navigate to [API Keys](https://printpal.io/api-keys)
3. Click "Create New API Key"
4. Copy your key (starts with `pp_live_`)

## Quality Levels

| Quality | Resolution | Credits | Time | Best For |
|---------|------------|---------|------|----------|
| `DEFAULT` | 256 cubed | 4 | ~20s | Quick previews |
| `HIGH` | 384 cubed | 6 | ~30s | Better detail |
| `ULTRA` | 512 cubed | 8 | ~60s | High quality |
| `SUPER` | 768 cubed | 20 | ~3min | Professional |
| `SUPER_TEXTURE` | 768 cubed | 40 | ~6min | With colors |
| `SUPERPLUS` | 1024 cubed | 30 | ~4min | Maximum detail |
| `SUPERPLUS_TEXTURE` | 1024 cubed | 50 | ~12min | Best quality |

## Output Formats

| Format | Extension | Best For |
|--------|-----------|----------|
| `STL` | .stl | 3D printing (default) |
| `GLB` | .glb | Web, games, textures |
| `OBJ` | .obj | Wide compatibility |
| `PLY` | .ply | Point clouds |
| `FBX` | .fbx | Animation (super only) |

## Usage Examples

### Basic Generation

```typescript
import { PrintPal, Quality, Format } from 'printpal';

const client = new PrintPal({ apiKey: 'pp_live_...' });

// Generate and download in one call
const path = await client.generateAndDownload(
  './image.png',
  './output.stl',
  {
    quality: Quality.SUPER,
    format: Format.STL,
    onProgress: (status) => console.log(status.status),
  }
);
```

### High-Resolution with Texture

```typescript
const path = await client.generateAndDownload(
  './product.png',
  './product.glb',
  {
    quality: Quality.SUPERPLUS_TEXTURE,
    format: Format.GLB,
  }
);
```

### Text to 3D

```typescript
const result = await client.generateFromPrompt({
  prompt: 'A cute robot character',
  quality: Quality.HIGH,
  format: Format.GLB,
});

const path = await client.waitAndDownload(
  result.generationUid,
  './robot.glb'
);
```

### Async Workflow (More Control)

```typescript
// Step 1: Submit generation
const result = await client.generateFromImage('./photo.png', {
  quality: Quality.SUPER,
});

console.log(`Generation UID: ${result.generationUid}`);
console.log(`Credits used: ${result.creditsUsed}`);

// Step 2: Poll for completion
const status = await client.waitForCompletion(result.generationUid, {
  pollInterval: 5000,
  onProgress: (s) => console.log(`Status: ${s.status}`),
});

// Step 3: Download
const downloadInfo = await client.getDownloadUrl(result.generationUid);
const path = await client.download(result.generationUid, './model.stl');
```

### Check Credits

```typescript
const credits = await client.getCredits();
console.log(`Balance: ${credits.credits} credits`);
```

### Generate from Buffer

```typescript
import * as fs from 'fs';

const imageBuffer = fs.readFileSync('./photo.png');

const result = await client.generateFromBuffer(
  imageBuffer,
  'photo.png',
  { quality: Quality.HIGH }
);
```

## Error Handling

```typescript
import {
  PrintPal,
  PrintPalError,
  AuthenticationError,
  InsufficientCreditsError,
  TimeoutError,
} from 'printpal';

try {
  const path = await client.generateAndDownload('./image.png');
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error('Invalid API key');
  } else if (error instanceof InsufficientCreditsError) {
    console.error(`Need ${error.creditsRequired} credits, have ${error.creditsAvailable}`);
  } else if (error instanceof TimeoutError) {
    console.error('Generation timed out');
  } else if (error instanceof PrintPalError) {
    console.error(`API error: ${error.message}`);
  }
}
```

## API Reference

### Client Methods

| Method | Description |
|--------|-------------|
| `generateFromImage(path, options)` | Generate 3D from image file |
| `generateFromBuffer(buffer, name, options)` | Generate 3D from image buffer |
| `generateFromPrompt(options)` | Generate 3D from text prompt |
| `generateAndDownload(path, output, options)` | Generate and download in one call |
| `getStatus(uid)` | Get generation status |
| `waitForCompletion(uid, options)` | Wait for generation to complete |
| `getDownloadUrl(uid)` | Get pre-signed download URL |
| `download(uid, path)` | Download completed model |
| `waitAndDownload(uid, path, options)` | Wait and download |
| `getCredits()` | Get credit balance |
| `getPricing()` | Get pricing information |
| `getUsage()` | Get usage statistics |
| `healthCheck()` | Check API health |

### Configuration

```typescript
const client = new PrintPal({
  apiKey: 'pp_live_...',      // Required
  baseUrl: 'https://...',     // Optional, default: https://printpal.io
  timeout: 60000,             // Optional, request timeout in ms
});
```

## Use Cases

- **E-commerce** - Create 3D product previews from photos
- **Gaming** - Generate 3D assets from concept art
- **Education** - Convert diagrams to 3D models
- **Architecture** - Transform sketches to 3D mockups
- **Manufacturing** - Rapid prototyping from images
- **Art & Design** - Bring 2D art to life in 3D

## Requirements

- Node.js 14.0.0 or higher
- PrintPal API key ([get one free](https://printpal.io/api-keys))

## Links

- [PrintPal Website](https://printpal.io)
- [API Documentation](https://printpal.io/api/documentation)
- [Get API Key](https://printpal.io/api-keys)
- [Buy Credits](https://printpal.io/buy-credits)
- [GitHub Repository](https://github.com/printpal-io/printpal-js)

## License

MIT License - see [LICENSE](LICENSE) for details.

---

<p align="center">
  <strong>3D Model Generation API | Image to 3D | Text to 3D | AI 3D Printing</strong>
</p>

<p align="center">
  Built with AI by <a href="https://printpal.io">PrintPal</a>
</p>

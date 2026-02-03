# Changelog

All notable changes to the PrintPal JavaScript/TypeScript client will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-02-03

### Added

- Initial release of the PrintPal JavaScript/TypeScript client
- Full TypeScript support with type definitions
- Image-to-3D generation with `generateFromImage()` and `generateFromBuffer()`
- Text-to-3D generation with `generateFromPrompt()`
- Convenience method `generateAndDownload()` for one-call generation
- All quality levels: default, high, ultra, super, super_texture, superplus, superplus_texture
- All output formats: STL, GLB, OBJ, PLY, FBX
- Quality-aware auto-timeouts for long-running generations
- Progress callbacks via `onProgress` option
- Credit balance checking with `getCredits()`
- Usage statistics with `getUsage()`
- Pricing information with `getPricing()`
- Health check with `healthCheck()`
- Comprehensive error classes for better error handling
- ESM and CommonJS module support
- Example scripts for common use cases

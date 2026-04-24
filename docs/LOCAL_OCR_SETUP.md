# Local OCR Model Setup

This app now includes a local OCR adapter entry point at:
- src/services/intelligence/localOcrModel.ts

## Current Mode
- Default implementation: HeuristicLocalOcrModel
- Works offline with no native dependency
- Uses filename/tags/note as seed text for searchable index

## Production Local OCR Options

## Option A: Google ML Kit (on-device)
1. Add a React Native bridge/plugin for ML Kit text recognition.
2. Implement LocalOcrModel using native module calls.
3. In initialize(), warm model runtime.
4. In extractText(), pass screenshot URI and return recognized text + confidence.

## Option B: Tesseract (offline)
1. Add a React Native OCR package with bundled tessdata.
2. Include language packs you need.
3. Implement LocalOcrModel wrapper and map output to OcrResult.

## Integration Points
- OCR indexing service: src/services/intelligence/ocrIndexService.ts
- Intelligence orchestration: src/store/useIntelligenceStore.ts
- Search filtering over OCR text: src/hooks/useFilteredScreenshots.ts

## Suggested Background Workflow
1. After screenshots load, queue OCR jobs in small batches.
2. Persist OCR text in SQLite for fast full-text search (FTS5).
3. Re-run OCR only if file hash changes.
4. Keep UI responsive by limiting concurrent OCR workers.

## Quality Notes
- Measure precision on receipts/code/docs/social samples.
- Track confidence and expose low-confidence fallback handling.
- Keep OCR fully local for privacy-first operation.

// Type stub for the native BarcodeDetector Web API
// Not yet in TypeScript's built-in lib types

interface BarcodeDetectorOptions {
  formats?: string[]
}

interface DetectedBarcode {
  rawValue: string
  format: string
  boundingBox: DOMRectReadOnly
  cornerPoints: ReadonlyArray<{ x: number; y: number }>
}

declare class BarcodeDetector {
  constructor(options?: BarcodeDetectorOptions)
  detect(image: ImageBitmapSource | HTMLVideoElement): Promise<DetectedBarcode[]>
  static getSupportedFormats(): Promise<string[]>
}

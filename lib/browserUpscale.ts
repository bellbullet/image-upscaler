/* eslint-disable @typescript-eslint/no-explicit-any */
export type ProgressCallback = (pct: number) => void;

export async function upscaleInBrowser(
  imageElement: HTMLImageElement,
  _scale: number,
  onProgress?: ProgressCallback
): Promise<string> {
  onProgress?.(5);

  const [UpscalerModule, ESRGANModule] = await Promise.all([
    import('upscaler'),
    import('@upscalerjs/esrgan-medium'),
  ]);

  onProgress?.(20);

  const Upscaler = UpscalerModule.default;
  const ESRGANMedium = ESRGANModule.default;

  const upscaler = new Upscaler({
    model: ESRGANMedium as any,
  });

  onProgress?.(40);

  const result: any = await upscaler.upscale(imageElement, {
    output: 'base64',
    progressCallback: (progress: { percent: number }) => {
      onProgress?.(40 + Math.round(progress.percent * 0.55));
    },
  } as any);

  onProgress?.(100);
  return result as unknown as string;
}

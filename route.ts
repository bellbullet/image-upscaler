import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, scale } = await req.json();

    if (!imageBase64 || !scale) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Strip data URL prefix if present
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const inputBuffer = Buffer.from(base64Data, 'base64');

    const image = sharp(inputBuffer);
    const metadata = await image.metadata();

    const newWidth = Math.round((metadata.width ?? 512) * scale);
    const newHeight = Math.round((metadata.height ?? 512) * scale);

    // Lanczos3 resampling — best quality for upscaling
    const outputBuffer = await image
      .resize(newWidth, newHeight, {
        kernel: sharp.kernel.lanczos3,
        fastShrinkOnLoad: false,
      })
      .png({ quality: 100, compressionLevel: 6 })
      .toBuffer();

    const outputBase64 = `data:image/png;base64,${outputBuffer.toString('base64')}`;
    return NextResponse.json({ outputBase64 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Sharp error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

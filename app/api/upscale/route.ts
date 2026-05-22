import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, scale, faceEnhance, apiKey } = await req.json();

    if (!imageBase64 || !apiKey) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const replicate = new Replicate({ auth: apiKey });

    // nightmareai/real-esrgan — well-maintained Real-ESRGAN on Replicate
    const output = await replicate.run(
      'nightmareai/real-esrgan:f121d640bd286e1fdc67f9799164c1d5be36ff74576ee11c803ae5b665dd46aa',
      {
        input: {
          image: imageBase64,
          scale: scale ?? 4,
          face_enhance: faceEnhance ?? false,
        },
      }
    );

    return NextResponse.json({ outputUrl: output });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Replicate error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

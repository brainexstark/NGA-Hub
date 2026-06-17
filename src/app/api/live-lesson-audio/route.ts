import { NextRequest, NextResponse } from 'next/server';
import { getAI } from '@/ai/genkit';

function buildWavDataUri(pcmBase64: string, sampleRate = 24000, channels = 1, bitDepth = 16) {
  const pcm = Buffer.from(pcmBase64, 'base64');
  const bytesPerSample = bitDepth / 8;
  const blockAlign = channels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const buffer = Buffer.alloc(44 + pcm.length);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + pcm.length, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(channels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitDepth, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(pcm.length, 40);
  pcm.copy(buffer, 44);

  return `data:audio/wav;base64,${buffer.toString('base64')}`;
}

function normalizeAudioDataUri(media: any) {
  if (!media || typeof media.url !== 'string') return '';
  const url = media.url.trim();
  if (url.startsWith('data:')) return url;

  const base64 = url.includes(',') ? url.split(',').pop() ?? '' : url;
  if (!base64) return '';

  return buildWavDataUri(base64);
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const lessonText = typeof body.lessonText === 'string' ? body.lessonText.trim() : '';

  if (!lessonText) {
    return NextResponse.json({ audioDataUri: '' }, { status: 400 });
  }

  const ai = getAI();
  if (!ai) {
    return NextResponse.json({ audioDataUri: '' });
  }

  try {
    const { googleAI } = await import('@genkit-ai/google-genai');
    const result = await ai.generate({
      model: googleAI.model('gemini-2.5-flash-preview-tts'),
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Algenib' },
          },
        },
      },
      prompt: lessonText,
    });

    const media = Array.isArray(result.media) ? result.media[0] : result.media;
    const audioDataUri = normalizeAudioDataUri(media) || '';
    return NextResponse.json({ audioDataUri });
  } catch (error) {
    return NextResponse.json({ audioDataUri: '' });
  }
}

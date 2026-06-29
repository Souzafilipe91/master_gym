/**
 * Transcrição de voz — usa OpenAI Whisper direto.
 * Configure OPENAI_API_KEY para ativar.
 */

export type TranscribeOptions = {
  audioUrl: string;
  language?: string;
  prompt?: string;
};

export type WhisperSegment = {
  id: number;
  start: number;
  end: number;
  text: string;
};

export type TranscribeResult = {
  text: string;
  language?: string;
  segments?: WhisperSegment[];
};

export async function transcribeAudio(
  options: TranscribeOptions
): Promise<TranscribeResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY não está configurada para transcrição de áudio.");
  }

  const audioRes = await fetch(options.audioUrl);
  if (!audioRes.ok) throw new Error("Falha ao baixar o áudio para transcrição");

  const audioBuffer = await audioRes.arrayBuffer();
  const formData = new FormData();
  formData.append("file", new Blob([audioBuffer]), "audio.webm");
  formData.append("model", "whisper-1");
  if (options.language) formData.append("language", options.language);
  if (options.prompt) formData.append("prompt", options.prompt);
  formData.append("response_format", "verbose_json");

  const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: formData,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Whisper API error (${res.status}): ${err}`);
  }

  return res.json() as Promise<TranscribeResult>;
}

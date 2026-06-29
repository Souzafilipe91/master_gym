/**
 * Geração de imagens — desabilitada por padrão.
 * Para ativar, configure OPENAI_API_KEY e use a API de imagens da OpenAI,
 * ou use outra plataforma de sua preferência (Stability AI, etc.).
 */

export type GenerateImageOptions = {
  prompt: string;
  originalImages?: Array<{ url?: string; b64Json?: string; mimeType?: string }>;
};

export type GenerateImageResponse = {
  url?: string;
};

export async function generateImage(
  _options: GenerateImageOptions
): Promise<GenerateImageResponse> {
  throw new Error(
    "Geração de imagens não está configurada. Adicione um serviço de geração de imagens (ex: OpenAI DALL-E)."
  );
}

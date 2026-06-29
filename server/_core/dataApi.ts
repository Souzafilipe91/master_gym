/**
 * Data API stub — integração com serviços externos de dados.
 * Para usar YouTube ou outras APIs, adicione sua chave diretamente aqui.
 */

export type DataApiCallOptions = {
  query?: Record<string, unknown>;
  body?: Record<string, unknown>;
  pathParams?: Record<string, unknown>;
  formData?: Record<string, unknown>;
};

export async function callDataApi(
  _apiId: string,
  _options: DataApiCallOptions = {}
): Promise<unknown> {
  throw new Error(
    "callDataApi não está configurado. Adicione sua chave de API diretamente neste arquivo para cada serviço necessário."
  );
}

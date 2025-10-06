// supabase/functions/_shared/connectors/serpapi.ts
const SERPAPI_API_KEY = Deno.env.get('SERPAPI_API_KEY');

interface ScrapeParams {
    engine: string;
    [key: string]: string;
}

/**
 * Função para fazer scraping de dados usando a SerpApi.
 * @param params - Parâmetros para a busca na SerpApi, incluindo o 'engine'.
 * @returns Os dados em JSON retornados pela API.
 */
export async function scrape(params: ScrapeParams): Promise<any> {
    if (!SERPAPI_API_KEY) {
        console.warn(`[SerpApi Connector] Chave da API (SERPAPI_API_KEY) não encontrada.`);
        return { error: "API key for SerpApi is not configured." };
    }

    const endpoint = new URL(`https://serpapi.com/search.json`);
    for (const key in params) {
        endpoint.searchParams.append(key, params[key]);
    }
    endpoint.searchParams.append('api_key', SERPAPI_API_KEY!);

    const response = await fetch(endpoint);
    if (!response.ok) {
        console.error(`[SerpApi Connector] Error fetching from engine: ${params.engine}. Status: ${response.status}`);
        return { error: `API Error: ${response.status}` };
    }
    return await response.json();
}
// backend/src/assistant.ts
import OpenAI from 'openai';
import axios from 'axios';
import * as cheerio from 'cheerio';
import * as dotenv from 'dotenv';
import * as path from 'path';

// --- CONFIGURAÇÃO ---
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const SERPER_API_KEY = process.env.SERPER_API_KEY;

// --- FUNÇÕES UTILITÁRIAS ---
function parsePriceBRL(priceText: string): number | null {
    if (!priceText) return null;
    try {
        const cleanedText = priceText.replace('R$', '').replace(/\./g, '').replace(',', '.').trim();
        const price = parseFloat(cleanedText);
        return isNaN(price) ? null : price;
    } catch (e) { return null; }
}
const getNextDay = (d: string) => { const dt = new Date(d); dt.setDate(dt.getDate() + 1); return dt.toISOString().split('T')[0]; };


// --- IMPLEMENTAÇÃO DAS FERRAMENTAS ---

async function get_market_prices({ city, target_date }: { city: string, target_date: string }) {
    console.log(`🛠️ Executando ferramenta: get_market_prices para ${city}`);
    const bookingUrl = `https://www.booking.com/searchresults.pt-br.html?ss=${encodeURIComponent(city)}&checkin=${target_date}&checkout=${getNextDay(target_date)}&group_adults=2`;
    let booking_avg: number | null = null;
    try {
        const { data: html } = await axios.get(bookingUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'Accept-Language': 'pt-BR,pt;q=0.9' } });
        const $ = cheerio.load(html);
        const prices: number[] = [];
        $('div[data-testid="property-card"]').each((_i, el) => {
            const priceText = $(el).find('span[data-testid="price-and-discounted-price"]').text();
            const price = parsePriceBRL(priceText);
            if (price) prices.push(price);
        });
        if (prices.length > 0) booking_avg = prices.reduce((a, b) => a + b, 0) / prices.length;
    } catch (error) { console.error(`Erro ao raspar Booking.com.`); }
    
    return JSON.stringify({
        booking_avg: booking_avg ? `R$ ${booking_avg.toFixed(2)}` : "Não foi possível obter dados",
    });
}

async function search_for_events_and_news({ city, target_date }: { city: string, target_date: string }) {
    console.log(`🛠️ Executando ferramenta: search_for_events_and_news para ${city}`);
    try {
        const { data } = await axios.post('https://google.serper.dev/search', { q: `eventos congressos turismo ${city} em ${target_date}` }, { headers: { 'X-API-KEY': SERPER_API_KEY, 'Content-Type': 'application/json' } });
        const snippets = data.organic.slice(0, 3).map((item: any) => item.snippet).join(' ');
        return JSON.stringify({ summary: snippets || "Nenhum evento ou notícia de grande impacto encontrado." });
    } catch (error) { return JSON.stringify({ error: "Erro ao pesquisar notícias." }); }
}

async function get_flight_price_analysis({ destination_city, target_date }: { destination_city: string, target_date: string }) {
    console.log(`🛠️ Executando ferramenta: get_flight_price_analysis para ${destination_city}`);
    try {
        const { data } = await axios.post('https://google.serper.dev/search', { q: `preço médio voo São Paulo para ${destination_city} em ${target_date}` }, { headers: { 'X-API-KEY': SERPER_API_KEY, 'Content-Type': 'application/json' } });
        const answerBox = data.answerBox?.answer || data.organic[0]?.snippet;
        return JSON.stringify({ analysis: answerBox || `Não foi possível obter uma análise de preços de voos.` });
    } catch (error) { return JSON.stringify({ error: "Erro ao analisar preços de voos." }); }
}


// --- ORQUESTRADOR DO ASSISTENTE ---

export async function handleAssistantConversation(assistantId: string, userMessage: string, threadId?: string) {
    const currentThreadId = threadId || (await openai.beta.threads.create()).id;
    await openai.beta.threads.messages.create(currentThreadId, { role: "user", content: userMessage });
    let run = await openai.beta.threads.runs.create(currentThreadId, { assistant_id: assistantId });

    while (run.status === 'requires_action' || run.status === 'in_progress') {
        if (run.status === 'requires_action') {
            const toolCalls = run.required_action!.submit_tool_outputs.tool_calls;
            const toolOutputs = [];
            for (const toolCall of toolCalls) {
                const functionName = toolCall.function.name;
                const args = JSON.parse(toolCall.function.arguments);
                let output: string;
                console.log(`🤖 Assistente quer rodar a ferramenta: ${functionName}`);
                const availableFunctions: { [key: string]: Function } = {
                    get_market_prices,
                    search_for_events_and_news,
                    get_flight_price_analysis,
                };
                const functionToCall = availableFunctions[functionName];
                output = await functionToCall(args);
                toolOutputs.push({ tool_call_id: toolCall.id, output });
            }
            
            run = await openai.beta.threads.runs.submitToolOutputs(
                currentThreadId,
                run.id,
                { tool_outputs: toolOutputs }
            );
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
        run = await openai.beta.threads.runs.retrieve(
            currentThreadId,
            run.id
        );
    }

    if (run.status === 'completed') {
        const messages = await openai.beta.threads.messages.list(currentThreadId);
        const assistantMessage = messages.data.find(m => m.role === 'assistant');
        const responseText = (assistantMessage?.content[0] as any)?.text.value;
        return { response: responseText, threadId: currentThreadId };
    } else {
        return { response: `Ocorreu um erro (Status: ${run.status}).`, threadId: currentThreadId };
    }
}
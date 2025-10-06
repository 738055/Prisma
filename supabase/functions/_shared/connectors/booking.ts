// supabase/functions/_shared/connectors/booking.ts

const BOOKING_API_KEY = Deno.env.get('BOOKING_DEMAND_API_KEY');
const BOOKING_API_URL = 'https://distribution-xml.booking.com/2.9/json/bookings'; // URL base da Demand API

interface HotelPrice {
    hotel_id: string;
    hotel_name: string;
    price: number;
    currency: string;
    review_score: number | null;
}

/**
 * Busca preços de hotéis para uma cidade e período específicos usando a Booking.com Demand API.
 * * @param cityId - O ID da cidade na Booking.com (ex: -2140479 para Paris).
 * @param checkin - Data de check-in no formato YYYY-MM-DD.
 * @param checkout - Data de check-out no formato YYYY-MM-DD.
 * @returns Uma lista de objetos HotelPrice com os dados encontrados.
 */
export async function fetchHotelPricesFromBookingAPI(cityId: number, checkin: string, checkout: string): Promise<HotelPrice[]> {
    if (!BOOKING_API_KEY) {
        console.warn("[Booking Connector] BOOKING_DEMAND_API_KEY não está configurada. A coleta será pulada.");
        return [];
    }

    // O corpo da requisição para o endpoint /accommodations/search da Demand API
    const requestBody = {
        booker: {
            country: "br", // País do reservante, importante para preços e impostos corretos
            platform: "desktop"
        },
        checkin: checkin,
        checkout: checkout,
        guests: {
            number_of_rooms: 1,
            number_of_adults: 2 // Usamos 2 adultos como padrão de busca
        },
        // A API da Booking.com geralmente usa um ID de cidade ou de hotel.
        // Precisaríamos de uma tabela de mapeamento para converter "Foz do Iguaçu" para o ID da Booking.
        city_ids: [cityId], 
        extras: ["hotel_info", "payment_info"],
        limit: 50 // Buscamos os 50 hotéis mais relevantes
    };

    try {
        const response = await fetch(`${BOOKING_API_URL}/accommodations/search`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${btoa(`${BOOKING_API_KEY}:`)}` // A Demand API usa Basic Auth com o token como username
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`A API do Booking.com retornou um erro: ${response.status} - ${errorBody}`);
        }

        const data = await response.json();

        if (!data.result) {
            return [];
        }

        // Mapeia a resposta da API para o nosso formato padronizado
        const formattedPrices: HotelPrice[] = data.result.map((hotel: any) => ({
            hotel_id: hotel.hotel_id,
            hotel_name: hotel.hotel_name,
            price: parseFloat(hotel.price.amount), // Extrai o valor numérico do preço
            currency: hotel.price.currency,
            review_score: hotel.review_score ? parseFloat(hotel.review_score) : null
        }));

        return formattedPrices;

    } catch (error) {
        console.error("[Booking Connector] Falha ao buscar dados da API do Booking:", error.message);
        return []; // Retorna um array vazio em caso de erro para não quebrar o fluxo
    }
}
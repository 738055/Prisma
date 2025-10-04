import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      cities: {
        Row: {
          id: string;
          name: string;
          state: string;
          slug: string;
          config: any;
          created_at: string;
        };
      };
      user_profiles: {
        Row: {
          id: string;
          hotel_name: string;
          city_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          hotel_name: string;
          city_id?: string | null;
        };
        Update: {
          hotel_name?: string;
          city_id?: string | null;
        };
      };
      demand_predictions: {
        Row: {
          id: string;
          city_id: string;
          prediction_date: string;
          demand_level: 'low' | 'moderate' | 'high' | 'peak';
          confidence_score: number;
          factors: any[];
          created_at: string;
        };
      };
      price_recommendations: {
        Row: {
          id: string;
          city_id: string;
          recommendation_date: string;
          recommended_price: number;
          market_average: number;
          reasoning: string;
          game_theory_data: any;
          created_at: string;
        };
      };
      events: {
        Row: {
          id: string;
          city_id: string;
          title: string;
          event_date: string;
          event_type: 'concert' | 'festival' | 'holiday' | 'conference' | 'sports' | 'other';
          impact_score: number;
          source: string;
          created_at: string;
        };
      };
      alerts: {
        Row: {
          id: string;
          city_id: string;
          alert_type: 'opportunity' | 'risk' | 'info';
          title: string;
          message: string;
          target_date: string | null;
          is_active: boolean;
          created_at: string;
        };
      };
      competitor_data: {
        Row: {
          id: string;
          city_id: string;
          hotel_name: string;
          price: number;
          availability: boolean;
          behavior_type: 'rational' | 'aggressive' | 'unknown';
          scraped_date: string;
          created_at: string;
        };
      };
    };
  };
};

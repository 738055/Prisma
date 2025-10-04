/*
  # Prisma - Hotel Intelligence Platform Schema

  1. New Tables
    - `cities`
      - `id` (uuid, primary key)
      - `name` (text) - City name
      - `state` (text) - State abbreviation
      - `slug` (text) - URL-friendly identifier
      - `config` (jsonb) - City-specific algorithm weights
      - `created_at` (timestamptz)
    
    - `user_profiles`
      - `id` (uuid, primary key, references auth.users)
      - `hotel_name` (text) - User's hotel name
      - `city_id` (uuid, references cities)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `demand_predictions`
      - `id` (uuid, primary key)
      - `city_id` (uuid, references cities)
      - `prediction_date` (date) - Date being predicted
      - `demand_level` (text) - low, moderate, high, peak
      - `confidence_score` (numeric) - 0-100
      - `factors` (jsonb) - Array of contributing factors
      - `created_at` (timestamptz)
    
    - `price_recommendations`
      - `id` (uuid, primary key)
      - `city_id` (uuid, references cities)
      - `recommendation_date` (date)
      - `recommended_price` (numeric)
      - `market_average` (numeric)
      - `reasoning` (text) - Explanation of recommendation
      - `game_theory_data` (jsonb) - Nash equilibrium calculations
      - `created_at` (timestamptz)
    
    - `events`
      - `id` (uuid, primary key)
      - `city_id` (uuid, references cities)
      - `title` (text)
      - `event_date` (date)
      - `event_type` (text) - concert, festival, holiday, conference
      - `impact_score` (numeric) - 1-10
      - `source` (text) - Data source
      - `created_at` (timestamptz)
    
    - `alerts`
      - `id` (uuid, primary key)
      - `city_id` (uuid, references cities)
      - `alert_type` (text) - opportunity, risk, info
      - `title` (text)
      - `message` (text)
      - `target_date` (date)
      - `is_active` (boolean) - Default true
      - `created_at` (timestamptz)
    
    - `competitor_data`
      - `id` (uuid, primary key)
      - `city_id` (uuid, references cities)
      - `hotel_name` (text)
      - `price` (numeric)
      - `availability` (boolean)
      - `behavior_type` (text) - rational, aggressive
      - `scraped_date` (date)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Cities table is publicly readable
    - Users can only access data for their selected city
*/

-- Create cities table
CREATE TABLE IF NOT EXISTS cities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  state text NOT NULL,
  slug text UNIQUE NOT NULL,
  config jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE cities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cities are viewable by everyone"
  ON cities FOR SELECT
  TO authenticated
  USING (true);

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  hotel_name text NOT NULL,
  city_id uuid REFERENCES cities(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create demand_predictions table
CREATE TABLE IF NOT EXISTS demand_predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id uuid REFERENCES cities(id) ON DELETE CASCADE NOT NULL,
  prediction_date date NOT NULL,
  demand_level text NOT NULL CHECK (demand_level IN ('low', 'moderate', 'high', 'peak')),
  confidence_score numeric CHECK (confidence_score >= 0 AND confidence_score <= 100),
  factors jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  UNIQUE(city_id, prediction_date, created_at)
);

ALTER TABLE demand_predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view predictions"
  ON demand_predictions FOR SELECT
  TO authenticated
  USING (true);

-- Create price_recommendations table
CREATE TABLE IF NOT EXISTS price_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id uuid REFERENCES cities(id) ON DELETE CASCADE NOT NULL,
  recommendation_date date NOT NULL,
  recommended_price numeric NOT NULL,
  market_average numeric DEFAULT 0,
  reasoning text NOT NULL,
  game_theory_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  UNIQUE(city_id, recommendation_date, created_at)
);

ALTER TABLE price_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view price recommendations"
  ON price_recommendations FOR SELECT
  TO authenticated
  USING (true);

-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id uuid REFERENCES cities(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  event_date date NOT NULL,
  event_type text NOT NULL CHECK (event_type IN ('concert', 'festival', 'holiday', 'conference', 'sports', 'other')),
  impact_score numeric CHECK (impact_score >= 1 AND impact_score <= 10),
  source text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view events"
  ON events FOR SELECT
  TO authenticated
  USING (true);

-- Create alerts table
CREATE TABLE IF NOT EXISTS alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id uuid REFERENCES cities(id) ON DELETE CASCADE NOT NULL,
  alert_type text NOT NULL CHECK (alert_type IN ('opportunity', 'risk', 'info')),
  title text NOT NULL,
  message text NOT NULL,
  target_date date,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view active alerts"
  ON alerts FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Create competitor_data table
CREATE TABLE IF NOT EXISTS competitor_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id uuid REFERENCES cities(id) ON DELETE CASCADE NOT NULL,
  hotel_name text NOT NULL,
  price numeric NOT NULL,
  availability boolean DEFAULT true,
  behavior_type text CHECK (behavior_type IN ('rational', 'aggressive', 'unknown')),
  scraped_date date NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE competitor_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view competitor data"
  ON competitor_data FOR SELECT
  TO authenticated
  USING (true);

-- Insert initial cities
INSERT INTO cities (name, state, slug, config) VALUES
  ('Foz do Iguaçu', 'PR', 'foz-iguacu', '{"peso_argentino_weight": 0.4, "terrestre_weight": 0.3, "events_weight": 0.15, "weather_weight": 0.15}'::jsonb),
  ('Gramado', 'RS', 'gramado', '{"events_weight": 0.35, "weather_weight": 0.35, "regional_searches_weight": 0.3}'::jsonb),
  ('Rio de Janeiro', 'RJ', 'rio-janeiro', '{"megaevents_weight": 0.4, "cruises_weight": 0.2, "international_weight": 0.2, "social_buzz_weight": 0.2}'::jsonb)
ON CONFLICT (slug) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_demand_predictions_city_date ON demand_predictions(city_id, prediction_date DESC);
CREATE INDEX IF NOT EXISTS idx_price_recommendations_city_date ON price_recommendations(city_id, recommendation_date DESC);
CREATE INDEX IF NOT EXISTS idx_events_city_date ON events(city_id, event_date);
CREATE INDEX IF NOT EXISTS idx_alerts_city_active ON alerts(city_id, is_active, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_competitor_data_city_date ON competitor_data(city_id, scraped_date DESC);
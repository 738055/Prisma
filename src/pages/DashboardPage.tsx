import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import Calendar from '../components/Calendar';
import AlertsPanel from '../components/AlertsPanel';
import CitySelector from '../components/CitySelector';
import DayDetailModal from '../components/DayDetailModal';
import Header from '../components/Header';

interface City {
  id: string;
  name: string;
  state: string;
  slug: string;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCities();
  }, []);

  const loadCities = async () => {
    const { data, error } = await supabase
      .from('cities')
      .select('id, name, state, slug')
      .order('name');

    if (!error && data) {
      setCities(data);
      if (data.length > 0) {
        setSelectedCity(data[0]);
      }
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CitySelector
          cities={cities}
          selectedCity={selectedCity}
          onCityChange={setSelectedCity}
        />

        {selectedCity && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
            <div className="lg:col-span-2">
              <Calendar
                cityId={selectedCity.id}
                onDateClick={setSelectedDate}
              />
            </div>

            <div className="lg:col-span-1">
              <AlertsPanel cityId={selectedCity.id} />
            </div>
          </div>
        )}
      </div>

      {selectedDate && selectedCity && (
        <DayDetailModal
          date={selectedDate}
          cityId={selectedCity.id}
          onClose={() => setSelectedDate(null)}
        />
      )}
    </div>
  );
}

import { MapPin } from 'lucide-react';

interface City {
  id: string;
  name: string;
  state: string;
  slug: string;
}

interface CitySelectorProps {
  cities: City[];
  selectedCity: City | null;
  onCityChange: (city: City) => void;
}

export default function CitySelector({ cities, selectedCity, onCityChange }: CitySelectorProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <div className="flex items-center gap-3 mb-4">
        <MapPin className="text-blue-600" size={24} />
        <h2 className="text-lg font-semibold text-slate-800">Selecione o Destino</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cities.map((city) => (
          <button
            key={city.id}
            onClick={() => onCityChange(city)}
            className={`p-4 rounded-xl border-2 transition ${
              selectedCity?.id === city.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div className="text-left">
              <div className="font-semibold text-slate-800">{city.name}</div>
              <div className="text-sm text-slate-600">{city.state}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

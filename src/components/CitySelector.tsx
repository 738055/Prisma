// src/components/CitySelector.tsx
import { MapPin } from 'lucide-react';

interface City { id: string; name: string; state: string; }
interface CitySelectorProps { cities: City[]; selectedCity: City | null; onCityChange: (city: City) => void; }

export default function CitySelector({ cities, selectedCity, onCityChange }: CitySelectorProps) {
  return (
    <div className="bg-slate-800/50 border border-slate-800 rounded-2xl p-4 md:p-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-4">
        <MapPin className="text-blue-400" size={20} />
        <h2 className="text-lg font-semibold text-slate-200">Destino da Análise</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {cities.map((city) => (
          <button key={city.id} onClick={() => onCityChange(city)} className={`p-4 rounded-xl border-2 transition text-left ${selectedCity?.id === city.id ? 'border-blue-500 bg-blue-500/10' : 'border-slate-700 hover:border-slate-600 bg-slate-800/60'}`}>
            <div className="font-semibold text-slate-200">{city.name}</div>
            <div className="text-sm text-slate-400">{city.state}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
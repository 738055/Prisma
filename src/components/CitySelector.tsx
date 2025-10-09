import { MapPin } from 'lucide-react';

interface City { id: string; name: string; state: string; }
interface CitySelectorProps { cities: City[]; selectedCity: City | null; onCityChange: (city: City) => void; }

export default function CitySelector({ cities, selectedCity, onCityChange }: CitySelectorProps) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 md:p-6 animate-fade-in border border-slate-200 dark:border-slate-700">
      <div className="flex items-center gap-3 mb-4">
        <MapPin className="text-slate-500 dark:text-slate-400" size={18} />
        <h2 className="text-md font-semibold text-slate-600 dark:text-slate-300">Destino da Análise</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {cities.map((city) => (
          <button 
            key={city.id} 
            onClick={() => onCityChange(city)} 
            className={`p-4 rounded-xl transition text-left text-lg font-bold
              ${selectedCity?.id === city.id 
                ? 'bg-blue-50 dark:bg-blue-500/10 ring-2 ring-blue-500 text-slate-800 dark:text-white' 
                : 'bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
          >
            {city.name}
          </button>
        ))}
      </div>
    </div>
  );
}
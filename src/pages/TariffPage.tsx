// src/pages/TariffPage.tsx
import { useState, useEffect, FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import Header from '../components/Header';
import { useAuth } from '../contexts/AuthContext';
import { DollarSign, BedDouble, Plus, Trash2, Calendar, AlertCircle } from 'lucide-react';

interface RoomType {
  id: string;
  name: string;
  capacity: number;
}
interface Tariff {
  id: string;
  start_date: string;
  end_date: string;
  price: number;
  room_type_id: string;
  room_types: { name: string } | null;
}

function RoomTypesManager({ roomTypes, loadData, onError }: { roomTypes: RoomType[], loadData: () => void, onError: (msg: string) => void }) {
  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState<number | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name || !capacity) return;
    if (!user) {
        onError("Você precisa estar logado para adicionar um quarto.");
        return;
    }
    setIsSubmitting(true);
    const { error } = await supabase.from('room_types').insert({ name, capacity: Number(capacity), user_id: user.id });
    if (error) {
        onError("Erro ao adicionar quarto. O nome já pode existir.");
    } else {
        setName('');
        setCapacity('');
        loadData();
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Apagar este tipo de quarto também irá apagar todos os tarifários associados. Deseja continuar?')) {
      const { error } = await supabase.from('room_types').delete().eq('id', id);
      if (error) onError("Erro ao apagar o quarto.");
      else loadData();
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-8 mb-8">
      <h2 className="text-lg font-semibold text-slate-800 mb-6 flex items-center gap-2">
        <BedDouble size={20} className="text-blue-600" /> 1. Gerir Tipos de Quarto
      </h2>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end mb-6">
        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Suíte Deluxe" required className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"/>
        <input type="number" value={capacity} onChange={e => setCapacity(e.target.value === '' ? '' : Number(e.target.value))} placeholder="Capacidade (hóspedes)" required min="1" className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"/>
        <button type="submit" disabled={isSubmitting} className="w-full bg-slate-700 text-white font-semibold py-3 rounded-lg hover:bg-slate-800 transition disabled:opacity-50">
            {isSubmitting ? 'Adicionando...' : 'Adicionar Quarto'}
        </button>
      </form>
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {roomTypes.map(rt => (
          <div key={rt.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div>
                <span className="font-medium text-slate-800">{rt.name}</span>
                <span className="text-sm text-slate-600 ml-2">({rt.capacity} pessoas)</span>
            </div>
            <button onClick={() => handleDelete(rt.id)} className="text-red-600 hover:text-red-800 p-2 rounded-full hover:bg-red-50 transition"><Trash2 size={18} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TariffPage() {
  const { user } = useAuth(); // <-- Adicionado para obter o usuário
  const [tariffs, setTariffs] = useState<Tariff[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [selectedRoomTypeId, setSelectedRoomTypeId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) { // <-- Garante que o usuário existe antes de carregar
        loadAllData();
    }
  }, [user]);

  const setErrorMessage = (msg: string) => {
      setError(msg);
      setTimeout(() => setError(null), 5000);
  }

  const loadAllData = async () => {
    if (!user) return; // <-- Adiciona verificação de segurança
    setLoading(true);
    // --- CORREÇÃO AQUI: Adicionado filtro por user_id ---
    const [tariffsRes, roomTypesRes] = await Promise.all([
      supabase.from('user_tariffs').select(`*, room_types ( name )`).eq('user_id', user.id).order('start_date', { ascending: false }),
      supabase.from('room_types').select('*').eq('user_id', user.id).order('name')
    ]);

    if (tariffsRes.error || roomTypesRes.error) {
      setErrorMessage('Não foi possível carregar os dados.');
    } else {
      setTariffs(tariffsRes.data as Tariff[]);
      setRoomTypes(roomTypesRes.data as RoomType[]);
    }
    setLoading(false);
  };

  const handleSubmitTariff = async (e: FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate || !price || !selectedRoomTypeId || !user) return; // <-- Adiciona verificação de usuário
    setIsSubmitting(true);
    
    // --- CORREÇÃO AQUI: Adicionado user_id no objeto de inserção ---
    const { error } = await supabase.from('user_tariffs').insert({ 
        start_date: startDate, 
        end_date: endDate, 
        price: Number(price), 
        room_type_id: selectedRoomTypeId,
        user_id: user.id 
    });

    if (error) {
        if (error.message.includes('overlapping')) {
            setErrorMessage('Erro: Conflito de datas para o mesmo tipo de quarto.');
        } else {
            setErrorMessage('Não foi possível salvar o tarifário.');
        }
    } else {
        setStartDate(''); setEndDate(''); setPrice(''); setSelectedRoomTypeId('');
        await loadAllData();
    }
    setIsSubmitting(false);
  };

  const handleDeleteTariff = async (id: string) => {
      if (window.confirm('Tem a certeza de que deseja apagar este tarifário?')) {
        const { error } = await supabase.from('user_tariffs').delete().eq('id', id);
        if (error) setErrorMessage("Erro ao apagar tarifário.");
        else await loadAllData();
      }
  };

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('pt-BR', { timeZone: 'UTC' });

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-3 mb-8">
            <DollarSign size={28} className="text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Meus Tarifários</h1>
              <p className="text-slate-600">Primeiro, adicione seus tipos de quarto. Depois, defina os preços para cada período.</p>
            </div>
        </div>
        
        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2"><AlertCircle size={20} /><span>{error}</span></div>}

        <RoomTypesManager roomTypes={roomTypes} loadData={loadAllData} onError={setErrorMessage}/>

        <div className="bg-white rounded-2xl shadow-sm p-8">
            <h2 className="text-lg font-semibold text-slate-800 mb-6 flex items-center gap-2">
                <Calendar size={20} className="text-blue-600" /> 2. Tarifários por Período
            </h2>
             <form onSubmit={handleSubmitTariff} className="grid grid-cols-1 md:grid-cols-5 gap-6 items-end mb-6">
                <select value={selectedRoomTypeId} onChange={e => setSelectedRoomTypeId(e.target.value)} required className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option value="" disabled>Selecione um quarto</option>
                    {roomTypes.map(rt => <option key={rt.id} value={rt.id}>{rt.name}</option>)}
                </select>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"/>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"/>
                <input type="number" value={price} onChange={e => setPrice(e.target.value === '' ? '' : Number(e.target.value))} placeholder="Preço (R$)" required min="0" step="0.01" className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"/>
                <button type="submit" disabled={isSubmitting || roomTypes.length === 0} className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
                    {isSubmitting ? 'Salvando...' : 'Salvar Tarifa'}
                </button>
            </form>

            {loading ? <p>Carregando...</p> : (
                 <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50"><tr><th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Tipo de Quarto</th><th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Período</th><th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Preço</th><th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Ações</th></tr></thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {tariffs.map(t => (
                                <tr key={t.id}>
                                    <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">{t.room_types?.name || 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-slate-700">{formatDate(t.start_date)} - {formatDate(t.end_date)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-slate-700">R$ {Number(t.price).toFixed(2)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right"><button onClick={() => handleDeleteTariff(t.id)} className="text-red-600 hover:text-red-800 p-2 rounded-full hover:bg-red-50 transition"><Trash2 size={18} /></button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
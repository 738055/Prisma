import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Bell, TrendingUp, AlertTriangle, Info } from 'lucide-react';

interface Alert {
  id: string;
  alert_type: 'opportunity' | 'risk' | 'info';
  title: string;
  message: string;
  target_date: string | null;
  created_at: string;
}

interface AlertsPanelProps {
  cityId: string;
}

export default function AlertsPanel({ cityId }: AlertsPanelProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAlerts();

    const subscription = supabase
      .channel('alerts-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'alerts',
        filter: `city_id=eq.${cityId}`
      }, () => {
        loadAlerts();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [cityId]);

  const loadAlerts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('alerts')
      .select('*')
      .eq('city_id', cityId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(10);

    if (!error && data) {
      setAlerts(data);
    }
    setLoading(false);
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'opportunity':
        return <TrendingUp size={20} className="text-green-600" />;
      case 'risk':
        return <AlertTriangle size={20} className="text-orange-600" />;
      case 'info':
        return <Info size={20} className="text-blue-600" />;
      default:
        return <Bell size={20} className="text-slate-600" />;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'opportunity':
        return 'bg-green-50 border-green-200';
      case 'risk':
        return 'bg-orange-50 border-orange-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-slate-50 border-slate-200';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Hoje';
    if (diffDays === 1) return 'Amanhã';
    if (diffDays > 0 && diffDays <= 7) return `Em ${diffDays} dias`;
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 h-full">
      <div className="flex items-center gap-3 mb-6">
        <Bell className="text-blue-600" size={24} />
        <h2 className="text-lg font-semibold text-slate-800">Alertas Inteligentes</h2>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : alerts.length === 0 ? (
        <div className="text-center py-12">
          <Bell size={48} className="text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600">Nenhum alerta no momento</p>
        </div>
      ) : (
        <div className="space-y-4 max-h-[600px] overflow-y-auto">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`border-2 rounded-xl p-4 transition hover:shadow-md ${getAlertColor(alert.alert_type)}`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {getAlertIcon(alert.alert_type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-slate-800">{alert.title}</h3>
                    {alert.target_date && (
                      <span className="text-xs font-medium text-slate-600 bg-white px-2 py-1 rounded ml-2 whitespace-nowrap">
                        {formatDate(alert.target_date)}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed">{alert.message}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

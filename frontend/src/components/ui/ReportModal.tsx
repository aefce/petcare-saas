import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BarChart3, TrendingUp, CalendarCheck, Loader2 } from 'lucide-react';
import apiClient from '../../api/client';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ReportModal({ isOpen, onClose }: ReportModalProps) {
  const [period, setPeriod] = useState<'daily'|'weekly'|'monthly'|'custom'|'all'>('daily');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [data, setData] = useState<{ total_revenue: number, completed_count: number, pending_count: number, report_date: string, period: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen && period !== 'custom') {
      fetchReport(period);
    }
  }, [isOpen, period]);

  const fetchReport = async (p: string, start?: string, end?: string) => {
    try {
      setIsLoading(true);
      let url = `/api/execution/report?period=${p}`;
      if (p === 'custom' && start && end) {
        url += `&start_date_str=${start}&end_date_str=${end}`;
      }
      const res = await apiClient.get(url);
      setData(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-3xl p-6 z-50 shadow-2xl"
          >
            <div className="flex justify-between items-center pb-4 border-b border-stone-100 mb-6">
              <h2 className="text-2xl font-bold text-stone-800 flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-indigo-600" />
                營業報表概況
              </h2>
              <button onClick={onClose} className="p-2 text-stone-400 hover:text-stone-600 rounded-full hover:bg-stone-100 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 區間切換 Segmented Control */}
            <div className="flex bg-stone-100 p-1 rounded-xl mb-4">
              {[
                { id: 'daily', label: '今日' },
                { id: 'weekly', label: '本週' },
                { id: 'monthly', label: '本月' },
                { id: 'custom', label: '自訂' },
                { id: 'all', label: '全部' }
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setPeriod(opt.id as any)}
                  className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-colors ${
                    period === opt.id 
                      ? 'bg-white text-indigo-600 shadow-sm' 
                      : 'text-stone-500 hover:text-stone-700 hover:bg-stone-200/50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <AnimatePresence>
              {period === 'custom' && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="flex gap-2 mb-6 overflow-hidden">
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="flex-1 px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  <span className="text-stone-400 self-center">-</span>
                  <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="flex-1 px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  <button onClick={() => { if (startDate && endDate) fetchReport('custom', startDate, endDate); }} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 disabled:opacity-50" disabled={!startDate || !endDate}>
                    查詢
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {isLoading ? (
              <div className="flex justify-center items-center h-32">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
              </div>
            ) : data ? (
              <div className="space-y-6">
                <div className="bg-indigo-50 p-6 rounded-2xl flex items-center justify-between">
                  <div>
                    <p className="text-indigo-600 font-bold text-sm mb-1">
                      {period === 'daily' ? '今日營收' : period === 'weekly' ? '本週營收' : period === 'monthly' ? '本月營收' : period === 'custom' ? '自訂區間營收' : '累積總營收'}
                    </p>
                    <h3 className="text-4xl font-bold text-indigo-900">NT$ {data.total_revenue.toLocaleString()}</h3>
                  </div>
                  <TrendingUp className="w-12 h-12 text-indigo-200" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="border border-stone-100 p-4 rounded-2xl">
                    <p className="text-stone-500 font-medium text-sm mb-1">已完成服務</p>
                    <h3 className="text-3xl font-bold text-stone-800">{data.completed_count} <span className="text-base font-normal text-stone-500">單</span></h3>
                  </div>
                  <div className="border border-stone-100 p-4 rounded-2xl">
                    <p className="text-stone-500 font-medium text-sm mb-1">待處理訂單</p>
                    <h3 className="text-3xl font-bold text-stone-800">{data.pending_count} <span className="text-base font-normal text-stone-500">單</span></h3>
                  </div>
                </div>

                <p className="text-xs text-stone-400 text-center font-mono bg-stone-50 p-2 rounded-lg border border-stone-100">
                  報表結算區間：{data.report_date}
                </p>
              </div>
            ) : (
              <p className="text-center text-stone-500 py-8">無法載入報表資料</p>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

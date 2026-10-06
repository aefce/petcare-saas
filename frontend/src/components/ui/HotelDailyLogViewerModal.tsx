import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Star, Calendar, User, Info, MessageSquare } from 'lucide-react';
import apiClient from '../../api/client';

interface HotelDailyLogViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  petName: string;
}

export function HotelDailyLogViewerModal({
  isOpen,
  onClose,
  bookingId,
  petName
}: HotelDailyLogViewerModalProps) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && bookingId) {
      fetchLogs();
    }
  }, [isOpen, bookingId]);

  const fetchLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiClient.get(`/api/hotel/bookings/${bookingId}/logs`);
      setLogs(res.data);
    } catch (err: any) {
      console.error(err);
      setError('載入照護日誌歷史失敗，請稍候重試。');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (score: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= score ? 'text-amber-400 fill-amber-400' : 'text-stone-200'
            }`}
          />
        ))}
      </div>
    );
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
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white rounded-3xl p-6 z-50 shadow-2xl overflow-y-auto max-h-[90vh] font-sans"
          >
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-stone-800">🏨 {petName} 的每日照護日誌</h2>
                <p className="text-sm text-stone-500 mt-1">追蹤寵物在店期間的日常健康與狀態</p>
              </div>
              <button onClick={onClose} className="p-2 text-stone-400 hover:text-stone-600 rounded-full hover:bg-stone-100 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-rose-50 text-rose-600 rounded-2xl text-sm font-medium border border-rose-100 flex items-center gap-2">
                <Info className="w-5 h-5 text-rose-500" />
                {error}
              </div>
            )}

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-stone-500">
                <Loader2 className="w-9 h-9 animate-spin text-amber-500" />
                <span className="text-sm font-medium">正在為您調閱照護日誌...</span>
              </div>
            ) : logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-stone-400 gap-3">
                <MessageSquare className="w-12 h-12 text-stone-300 stroke-[1.5]" />
                <p className="text-sm font-medium">目前尚無每日照護日誌記錄。</p>
                <p className="text-xs text-stone-400 max-w-xs text-center">照護員將在入住期間每天發布日誌，讓您即時掌握寶貝的健康與情緒狀況。</p>
              </div>
            ) : (
              <div className="space-y-6 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-stone-100">
                {logs.map((log, idx) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="relative pl-10"
                  >
                    {/* Time Dot */}
                    <div className="absolute left-2 top-2 w-4.5 h-4.5 rounded-full border-4 border-white bg-amber-500 shadow-sm" />

                    <div className="bg-stone-50 rounded-2xl p-5 border border-stone-100 hover:shadow-md transition duration-300">
                      {/* Meta info */}
                      <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
                        <div className="flex items-center gap-2 text-stone-700 font-bold text-sm">
                          <Calendar className="w-4 h-4 text-amber-500" />
                          <span>{log.date}</span>
                        </div>
                        {log.staff_name && (
                          <div className="flex items-center gap-1.5 text-xs text-stone-500 bg-stone-200/50 px-2.5 py-1 rounded-full font-medium">
                            <User className="w-3.5 h-3.5 text-stone-400" />
                            <span>照護員: {log.staff_name}</span>
                          </div>
                        )}
                      </div>

                      {/* Scores & Stool */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4 bg-white p-3.5 rounded-xl border border-stone-100">
                        <div className="space-y-1">
                          <span className="text-xs text-stone-400 font-semibold block">精神情緒</span>
                          {renderStars(log.mood_score)}
                        </div>
                        <div className="space-y-1">
                          <span className="text-xs text-stone-400 font-semibold block">每日食慾</span>
                          {renderStars(log.appetite_score)}
                        </div>
                        <div className="space-y-1">
                          <span className="text-xs text-stone-400 font-semibold block">排便狀況</span>
                          <span className={`inline-flex items-center text-xs font-bold px-2 py-0.5 rounded ${
                            log.defecation_status === '正常' 
                              ? 'bg-emerald-50 text-emerald-700' 
                              : log.defecation_status === '便秘' 
                              ? 'bg-amber-50 text-amber-700' 
                              : 'bg-rose-50 text-rose-700'
                          }`}>
                            {log.defecation_status}
                          </span>
                        </div>
                      </div>

                      {/* Notes */}
                      <div className="text-stone-700 text-sm leading-relaxed whitespace-pre-line mb-4">
                        {log.notes}
                      </div>

                      {/* Image */}
                      {log.image_url && (
                        <div className="rounded-xl overflow-hidden border border-stone-200 max-h-80 w-full flex items-center justify-center bg-stone-100">
                          <img
                            src={log.image_url}
                            alt={`${petName} daily log`}
                            className="object-cover w-full h-full hover:scale-102 transition duration-300 cursor-zoom-in"
                            onClick={() => window.open(log.image_url, '_blank')}
                          />
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Star, Calendar } from 'lucide-react';
import apiClient from '../../api/client';

interface ServiceLogViewerProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  petName: string;
}

export function ServiceLogViewer({ isOpen, onClose, bookingId, petName }: ServiceLogViewerProps) {
  const [records, setRecords] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchRecords();
    }
  }, [isOpen, bookingId]);

  const fetchRecords = async () => {
    try {
      setIsLoading(true);
      const res = await apiClient.get(`/api/execution/bookings/${bookingId}/records`);
      setRecords(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStars = (score: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${star <= score ? 'text-amber-400 fill-amber-400' : 'text-stone-200'}`}
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
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg max-h-[85vh] overflow-y-auto bg-white rounded-3xl p-6 z-50 shadow-2xl"
          >
            <div className="flex justify-between items-center mb-6 sticky top-0 bg-white z-10 pb-2 border-b border-stone-100">
              <h2 className="text-xl font-bold text-stone-800">{petName} 的服務日誌</h2>
              <button onClick={onClose} className="p-2 text-stone-400 hover:text-stone-600 rounded-full hover:bg-stone-100 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center h-32">
                <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
              </div>
            ) : records.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-stone-500">目前尚無服務日誌</p>
              </div>
            ) : (
              <div className="space-y-6">
                {records.map((record) => (
                  <div key={record.id} className="bg-stone-50 rounded-2xl p-5 border border-stone-100">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-2 text-stone-500 text-sm">
                        <Calendar className="w-4 h-4" />
                        {new Date(record.created_at + 'Z').toLocaleString('zh-TW')}
                      </div>
                      <span className="px-2 py-1 bg-white border border-stone-200 rounded-lg text-xs font-medium text-stone-600">
                        {record.staff_name}
                      </span>
                    </div>

                    <div className="flex gap-6 mb-4">
                      <div className="space-y-1">
                        <span className="text-xs text-stone-500 font-medium">情緒評分</span>
                        {renderStars(record.mood_score)}
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-stone-500 font-medium">食慾評分</span>
                        {renderStars(record.appetite_score)}
                      </div>
                    </div>

                    {record.notes && (
                      <p className="text-stone-700 bg-white p-4 rounded-xl text-sm leading-relaxed border border-stone-100">
                        {record.notes}
                      </p>
                    )}

                    {record.image_url && (
                      <div className="mt-4 rounded-xl overflow-hidden border border-stone-200">
                        <img src={record.image_url} alt="Service photo" className="w-full h-auto object-cover" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

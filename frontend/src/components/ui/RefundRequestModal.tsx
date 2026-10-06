import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, AlertCircle } from 'lucide-react';
import apiClient from '../../api/client';

interface RefundRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  petName: string;
  onSuccess: () => void;
}

const AUTO_APPROVE_REASONS = ["毛孩生病", "天候惡劣", "提前三天以上取消"];

export const RefundRequestModal = ({ isOpen, onClose, bookingId, petName, onSuccess }: RefundRequestModalProps) => {
  const [reason, setReason] = useState(AUTO_APPROVE_REASONS[0]);
  const [customReason, setCustomReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const finalReason = reason === '其他 (客訴、無故取消等)' ? customReason : reason;
      if (!finalReason) {
        alert("請輸入退費理由");
        setLoading(false);
        return;
      }

      await apiClient.post('/api/payment/refund/request', {
        booking_id: bookingId,
        reason: finalReason,
        details: reason === '其他 (客訴、無故取消等)' ? '需要店長人工審核' : '常規退費',
      });
      
      onSuccess();
      onClose();
    } catch (e: any) {
      console.error(e);
      alert(e.response?.data?.detail || "退費申請失敗");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg bg-white rounded-3xl p-6 z-50 shadow-2xl"
          >
            <button onClick={onClose} className="absolute top-6 right-6 p-2 text-stone-400 hover:text-stone-600 rounded-full hover:bg-stone-100">
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6">
              <h2 className="text-2xl font-bold text-rose-600">發起退費申請</h2>
              <p className="text-stone-500 mt-2">為 【{petName}】 辦理退款手續</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-2">退費理由</label>
                <select 
                  className="w-full p-3 rounded-xl border border-stone-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                >
                  {AUTO_APPROVE_REASONS.map(r => (
                    <option key={r} value={r}>{r} (系統自動批准)</option>
                  ))}
                  <option value="其他 (客訴、無故取消等)">其他 (客訴、異常取消)</option>
                </select>
              </div>

              {reason === '其他 (客訴、無故取消等)' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                  <label className="block text-sm font-bold text-stone-700 mb-2 mt-4">請輸入異常原因 (將送交店長審核)</label>
                  <textarea 
                    className="w-full p-3 rounded-xl border border-stone-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 h-24"
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="例如：主人覺得太貴、抱怨服務態度..."
                  />
                  <div className="mt-2 flex items-center gap-2 text-amber-600 text-sm font-medium bg-amber-50 p-2 rounded-lg">
                    <AlertCircle className="w-4 h-4" />
                    送出後將不會立即退款，需等待店長確認。
                  </div>
                </motion.div>
              )}
            </div>

            <button 
              onClick={handleSubmit}
              disabled={loading}
              className="w-full mt-8 bg-rose-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-rose-600/20 hover:bg-rose-700 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : '確認送出'}
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

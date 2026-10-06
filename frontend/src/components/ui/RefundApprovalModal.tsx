import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Check, Ban } from 'lucide-react';
import apiClient from '../../api/client';

interface RefundApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const RefundApprovalModal = ({ isOpen, onClose, onSuccess }: RefundApprovalModalProps) => {
  const [refunds, setRefunds] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchRefunds();
    }
  }, [isOpen]);

  const fetchRefunds = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/api/payment/refund/pending');
      setRefunds(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    try {
      await apiClient.post(`/api/payment/refund/${id}/${action}`);
      alert(action === 'approve' ? "已批准退款" : "已駁回退款");
      fetchRefunds();
      onSuccess();
    } catch (e: any) {
      console.error(e);
      alert(e.response?.data?.detail || "操作失敗");
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
            className="relative w-full max-w-2xl bg-white rounded-3xl p-6 z-50 shadow-2xl flex flex-col max-h-[80vh]"
          >
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-stone-800">💰 退費人工審查</h2>
                <p className="text-stone-500 mt-1">此區列出所有無法被系統自動通過的異常退款申請。</p>
              </div>
              <button onClick={onClose} className="p-2 text-stone-400 hover:text-stone-600 rounded-full hover:bg-stone-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
              {loading ? (
                <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-stone-400" /></div>
              ) : refunds.length === 0 ? (
                <div className="text-center p-12 text-stone-400 font-medium bg-stone-50 rounded-2xl border border-stone-100 border-dashed">
                  太棒了，目前沒有任何異常退款單需要審核！
                </div>
              ) : (
                refunds.map(r => (
                  <div key={r.id} className="bg-white border border-rose-100 shadow-sm shadow-rose-100/50 rounded-2xl p-4 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-rose-500" />
                    <div className="space-y-1 ml-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-stone-800 text-lg">{r.pet_name}</span>
                        <span className="text-sm bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full font-bold">NT$ {r.amount}</span>
                      </div>
                      <p className="text-sm text-stone-500">{r.service_name}</p>
                      <div className="bg-stone-50 p-2 rounded-lg mt-2 inline-block">
                        <p className="text-sm font-bold text-stone-700">退費理由：</p>
                        <p className="text-sm text-stone-600">{r.reason}</p>
                        {r.details && <p className="text-xs text-stone-400 mt-1">備註：{r.details}</p>}
                      </div>
                    </div>
                    
                    <div className="flex gap-2 w-full md:w-auto">
                      <button 
                        onClick={() => handleAction(r.id, 'reject')}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 border border-stone-200 text-stone-600 rounded-xl hover:bg-stone-50 transition font-bold text-sm"
                      >
                        <Ban className="w-4 h-4" /> 駁回
                      </button>
                      <button 
                        onClick={() => handleAction(r.id, 'approve')}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 transition font-bold text-sm"
                      >
                        <Check className="w-4 h-4" /> 批准退款
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

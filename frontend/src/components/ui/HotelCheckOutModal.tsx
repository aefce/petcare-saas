import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, DollarSign, PlusCircle, ShieldAlert } from 'lucide-react';
import apiClient from '../../api/client';

interface HotelCheckOutModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  petName: string;
  roomTypeName: string;
  baseFee: number;
  onSuccess: () => void;
}

export function HotelCheckOutModal({
  isOpen,
  onClose,
  bookingId,
  petName,
  roomTypeName,
  baseFee,
  onSuccess
}: HotelCheckOutModalProps) {
  const [addOnFee, setAddOnFee] = useState<number>(0);
  const [overtimeFee, setOvertimeFee] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const totalFee = baseFee + addOnFee + overtimeFee;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      await apiClient.post(`/api/hotel/bookings/${bookingId}/check-out`, {
        add_on_fee: addOnFee,
        overtime_fee: overtimeFee
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || '辦理退房失敗，請重試。');
    } finally {
      setIsSubmitting(false);
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
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-3xl p-6 z-50 shadow-2xl overflow-y-auto max-h-[90vh] font-sans"
          >
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-stone-800">辦理退房與結帳</h2>
                <p className="text-sm text-stone-500 mt-1">寵物：{petName} ({roomTypeName})</p>
              </div>
              <button onClick={onClose} className="p-2 text-stone-400 hover:text-stone-600 rounded-full hover:bg-stone-100 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-rose-50 text-rose-600 rounded-xl text-sm font-medium flex items-start gap-2 border border-rose-100">
                <ShieldAlert className="w-5 h-5 shrink-0 text-rose-500" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* 基本預約費展示 */}
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100 flex justify-between items-center">
                <div>
                  <span className="text-sm font-semibold text-stone-500">基本房費</span>
                  <p className="text-xs text-stone-400 mt-0.5">依據預約天數與房型定價計算</p>
                </div>
                <span className="text-lg font-bold text-stone-700">NT$ {baseFee.toLocaleString()}</span>
              </div>

              {/* 加購費用輸入 */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-stone-700 flex items-center gap-1.5">
                  <PlusCircle className="w-4 h-4 text-stone-400" />
                  加購項目費用 (罐頭、洗澡美容等)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 text-sm font-semibold">NT$</span>
                  <input
                    type="number"
                    min="0"
                    value={addOnFee}
                    onChange={(e) => setAddOnFee(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 pl-12 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all text-stone-800 text-sm font-semibold"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* 超時費輸入 */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-stone-700 flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-stone-400" />
                  超時退房費 (Overtime Fee)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 text-sm font-semibold">NT$</span>
                  <input
                    type="number"
                    min="0"
                    value={overtimeFee}
                    onChange={(e) => setOvertimeFee(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 pl-12 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all text-stone-800 text-sm font-semibold"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* 結帳明細與總金額 (WOW Effect, Glassmorphism, Harmonized Colors) */}
              <div className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50/50 rounded-2xl border border-blue-100/50 space-y-3">
                <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wider">結帳帳單明細</h4>
                <div className="space-y-1.5 text-sm text-stone-600">
                  <div className="flex justify-between">
                    <span>基本費用</span>
                    <span>NT$ {baseFee.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>加購費用</span>
                    <span>+ NT$ {addOnFee.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>超時費用</span>
                    <span>+ NT$ {overtimeFee.toLocaleString()}</span>
                  </div>
                </div>
                <div className="h-px bg-blue-100 my-2" />
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-stone-800">應收總計金額</span>
                  <span className="text-2xl font-black text-blue-600">NT$ {totalFee.toLocaleString()}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 hover:bg-blue-700 transition active:scale-95 disabled:opacity-70 disabled:pointer-events-none"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  '確認結帳退房 (Complete Check-Out)'
                )}
              </button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

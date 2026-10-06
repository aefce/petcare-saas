import { useState, useRef, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, Star, Loader2, ClipboardList, ShieldAlert } from 'lucide-react';
import apiClient from '../../api/client';

interface HotelDailyLogCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  petName: string;
  onSuccess: () => void;
}

export function HotelDailyLogCreateModal({
  isOpen,
  onClose,
  bookingId,
  petName,
  onSuccess
}: HotelDailyLogCreateModalProps) {
  const [moodScore, setMoodScore] = useState(5);
  const [appetiteScore, setAppetiteScore] = useState(5);
  const [defecationStatus, setDefecationStatus] = useState('正常');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl('');
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      // 1. 建立旅館每日日誌
      const res = await apiClient.post(`/api/hotel/bookings/${bookingId}/logs`, {
        mood_score: moodScore,
        appetite_score: appetiteScore,
        defecation_status: defecationStatus,
        notes: notes,
        image_url: null
      });
      
      const log = res.data;

      // 2. 二階段非同步上傳照片
      if (selectedFile && log?.id) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        await apiClient.post(`/api/hotel/logs/${log.id}/image`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      }

      onSuccess();
      onClose();
      // 重置狀態
      setMoodScore(5);
      setAppetiteScore(5);
      setDefecationStatus('正常');
      setNotes('');
      setSelectedFile(null);
      setPreviewUrl('');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || '提交日誌失敗，請重試');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (score: number, setScore: (s: number) => void) => {
    return (
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            onClick={() => setScore(star)}
            className={`w-6 h-6 cursor-pointer transition-colors ${
              star <= score ? 'text-amber-400 fill-amber-400' : 'text-stone-300 hover:text-amber-300'
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
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-3xl p-6 z-50 shadow-2xl overflow-y-auto max-h-[90vh] font-sans"
          >
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-stone-800">撰寫 {petName} 照護日誌</h2>
                  <p className="text-xs text-stone-400 mt-0.5">每日食慾、情緒、排便與萌照上傳</p>
                </div>
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

            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* 情緒 */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-stone-700">精神情緒</label>
                {renderStars(moodScore, setMoodScore)}
              </div>

              {/* 食慾 */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-stone-700">每日食慾</label>
                {renderStars(appetiteScore, setAppetiteScore)}
              </div>

              {/* 排便狀況 */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-stone-700">排便狀況</label>
                <select
                  value={defecationStatus}
                  onChange={(e) => setDefecationStatus(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white transition-all text-stone-800 text-sm font-medium"
                >
                  <option value="正常">正常 (Solid)</option>
                  <option value="便秘">便秘 (Dry/Hard)</option>
                  <option value="下痢">下痢 (Loose/Diarrhea)</option>
                </select>
              </div>

              {/* 日誌紀錄與狀況 */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-stone-700">詳細照護日誌</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white transition-all h-24 resize-none text-stone-800 text-sm"
                  placeholder="例如：今天食慾很好，帶去活動區跑步玩玩具，跟其他狗相處良好。"
                  required
                />
              </div>

              {/* 照片上傳 */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-stone-700">日誌照片 (上傳今日萌照)</label>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />
                
                {previewUrl ? (
                  <div className="relative group rounded-xl overflow-hidden border border-stone-200 aspect-video bg-stone-50 flex items-center justify-center">
                    <img src={previewUrl} alt="Preview" className="object-cover w-full h-full" />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/85 text-white rounded-full transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full aspect-video border-2 border-dashed border-stone-200 hover:border-amber-400 rounded-xl flex flex-col items-center justify-center gap-2 text-stone-400 hover:text-amber-500 bg-stone-50 hover:bg-amber-50/20 transition-all"
                  >
                    <Camera className="w-8 h-8 text-stone-400" />
                    <span className="text-xs font-semibold">點擊上傳或拍照日誌萌照</span>
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-amber-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 hover:bg-amber-600 transition active:scale-95 disabled:opacity-70 disabled:pointer-events-none"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  '送出照護日誌'
                )}
              </button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

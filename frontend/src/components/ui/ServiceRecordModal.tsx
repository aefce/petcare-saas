import { useState, useRef, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, Star, Loader2, Image as ImageIcon } from 'lucide-react';
import apiClient from '../../api/client';

interface ServiceRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  petName: string;
  onSuccess: () => void;
}

export function ServiceRecordModal({ isOpen, onClose, bookingId, petName, onSuccess }: ServiceRecordModalProps) {
  const [moodScore, setMoodScore] = useState(5);
  const [appetiteScore, setAppetiteScore] = useState(5);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [foodType, setFoodType] = useState('');
  const [foodWeightG, setFoodWeightG] = useState('');
  const [healthCheckResults, setHealthCheckResults] = useState('');
  const [isAbnormal, setIsAbnormal] = useState(false);

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
      // 1. 建立服務日誌紀錄
      const res = await apiClient.post(`/api/execution/bookings/${bookingId}/records`, {
        mood_score: moodScore,
        appetite_score: appetiteScore,
        notes: notes,
        image_url: null,
        food_type: foodType || null,
        food_weight_g: foodWeightG ? parseInt(foodWeightG) : null,
        health_check_results: healthCheckResults || null,
        is_abnormal: isAbnormal
      });
      
      const record = res.data;

      // 2. 如果有選擇檔案，則上傳圖片並關聯
      if (selectedFile && record?.id) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        await apiClient.post(`/api/execution/records/${record.id}/image`, formData, {
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
      setNotes('');
      setSelectedFile(null);
      setPreviewUrl('');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || '提交失敗，請重試');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (score: number, setScore: (s: number) => void) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            onClick={() => setScore(star)}
            className={`w-6 h-6 cursor-pointer transition-colors ${star <= score ? 'text-amber-400 fill-amber-400' : 'text-stone-300'}`}
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
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-3xl p-6 z-50 shadow-2xl overflow-y-auto max-h-[90vh]"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-stone-800">撰寫 {petName} 的服務日誌</h2>
              <button onClick={onClose} className="p-2 text-stone-400 hover:text-stone-600 rounded-full hover:bg-stone-100 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-stone-700">情緒評分</label>
                  {renderStars(moodScore, setMoodScore)}
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-stone-700">食慾評分</label>
                  {renderStars(appetiteScore, setAppetiteScore)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-stone-700">飼料種類 (選填)</label>
                  <input
                    type="text"
                    value={foodType}
                    onChange={(e) => setFoodType(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white transition-all text-sm"
                    placeholder="例如：皇家幼犬配方"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-stone-700">餵食重量/克 (選填)</label>
                  <input
                    type="number"
                    value={foodWeightG}
                    onChange={(e) => setFoodWeightG(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white transition-all text-sm"
                    placeholder="例如：150"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-stone-700">健康檢測結果 (選填)</label>
                <input
                  type="text"
                  value={healthCheckResults}
                  onChange={(e) => setHealthCheckResults(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white transition-all text-sm"
                  placeholder="例如：排泄正常，耳朵無異味"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-stone-700">服務紀錄與狀況 (必填)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white transition-all h-20 resize-none text-sm"
                  placeholder="請描述本次服務或照護的詳細狀況..."
                  required
                />
              </div>
              
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="abnormal_check" 
                  checked={isAbnormal}
                  onChange={(e) => setIsAbnormal(e.target.checked)}
                  className="w-4 h-4 text-rose-500 rounded border-stone-300 focus:ring-rose-500"
                />
                <label htmlFor="abnormal_check" className="text-sm font-bold text-rose-600 cursor-pointer">
                  ⚠️ 標記為異常狀況 (將自動通知店長)
                </label>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-stone-700">日誌照片 (選填)</label>
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
                    <Camera className="w-8 h-8" />
                    <span className="text-xs font-medium">點擊上傳服務日誌照片</span>
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-stone-800 text-white font-semibold py-3.5 rounded-xl shadow-sm flex items-center justify-center gap-2 hover:bg-stone-700 transition disabled:opacity-70"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : '送出日誌'}
              </button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Award, Loader2, Check } from 'lucide-react';
import apiClient from '../../api/client';

interface UpgradeMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function UpgradeMemberModal({
  isOpen,
  onClose,
  onSuccess
}: UpgradeMemberModalProps) {
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim() || !email.trim() || !password.trim()) {
      setError('所有欄位皆為必填');
      return;
    }
    if (password.length < 8) {
      setError('密碼長度必須至少為 8 個字元');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      setSuccess(false);

      await apiClient.post('/api/auth/upgrade-guest', {
        phone: phone.trim(),
        email: email.trim(),
        password: password
      });

      setSuccess(true);
      setPhone('');
      setEmail('');
      setPassword('');

      if (onSuccess) onSuccess();
      
      // Auto close after 1.5 seconds
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || '升級失敗，請檢查該電話是否已綁定或信箱是否已被使用。');
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
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-3xl p-6 z-50 shadow-2xl"
          >
            <div className="flex justify-between items-center pb-4 border-b border-stone-100 mb-6">
              <h2 className="text-2xl font-bold text-stone-800 flex items-center gap-2">
                <Award className="w-6 h-6 text-teal-600" />
                升級散客為正式會員
              </h2>
              <button onClick={onClose} className="p-2 text-stone-400 hover:text-stone-600 rounded-full hover:bg-stone-100 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {success ? (
              <div className="py-8 flex flex-col items-center justify-center space-y-4">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                  <Check className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-stone-800">升級成功！</h3>
                <p className="text-stone-500 text-sm">該散客已成功轉換為正式會員帳號。</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-medium">
                    {error}
                  </div>
                )}

                <div className="bg-teal-50 text-teal-800 p-4 rounded-2xl text-xs space-y-1 mb-4">
                  <p className="font-bold text-teal-900">💡 關於 Guest 單鍵升級邏輯：</p>
                  <p>輸入散客當初建檔時所填的手機號碼，即可將該現場散客升級為正式會員，並綁定為正式帳號可供登入。</p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-stone-600 mb-1.5">散客建檔電話 *</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="請輸入原建檔手機（如：0912345678）"
                    className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 focus:outline-none focus:ring-2 focus:ring-teal-500/50 text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-stone-600 mb-1.5">註冊信箱 *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="輸入該會員未來登入使用的信箱"
                    className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 focus:outline-none focus:ring-2 focus:ring-teal-500/50 text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-stone-600 mb-1.5">設定登入密碼 *</label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="請設定至少 8 碼的密碼"
                    className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 focus:outline-none focus:ring-2 focus:ring-teal-500/50 text-sm"
                    required
                  />
                </div>

                <div className="flex gap-3 pt-4 border-t border-stone-100 mt-6">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-3 border border-stone-200 text-stone-600 font-bold rounded-2xl hover:bg-stone-50 transition-colors text-sm"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-bold rounded-2xl hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2 text-sm shadow-sm"
                  >
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                    確認升級
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

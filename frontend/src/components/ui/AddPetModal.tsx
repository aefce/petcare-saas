import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, PawPrint, Loader2 } from 'lucide-react';
import apiClient from '../../api/client';

interface AddPetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddPetModal({ isOpen, onClose, onSuccess }: AddPetModalProps) {
  const [name, setName] = useState('');
  const [species, setSpecies] = useState('Dog');
  const [breed, setBreed] = useState('');
  const [weight, setWeight] = useState('');
  const [medicalNotes, setMedicalNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('請輸入毛小孩的姓名');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      await apiClient.post('/api/booking/pets', {
        name: name.trim(),
        species,
        breed: breed.trim() || null,
        weight_kg: weight ? parseFloat(weight) : null,
        medical_notes: medicalNotes.trim() || null,
      });
      
      // Reset form
      setName('');
      setSpecies('Dog');
      setBreed('');
      setWeight('');
      setMedicalNotes('');
      
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || '新增失敗，請稍後再試');
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
                <PawPrint className="w-6 h-6 text-orange-500" />
                新增毛小孩
              </h2>
              <button onClick={onClose} className="p-2 text-stone-400 hover:text-stone-600 rounded-full hover:bg-stone-100 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-medium">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-stone-600 mb-1.5">姓名 *</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="例如：可樂"
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-stone-600 mb-1.5">種類 *</label>
                  <select
                    value={species}
                    onChange={e => setSpecies(e.target.value)}
                    className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                  >
                    <option value="Dog">狗狗 🐶</option>
                    <option value="Cat">貓咪 🐱</option>
                    <option value="Other">其他 🐾</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-stone-600 mb-1.5">體重 (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={weight}
                    onChange={e => setWeight(e.target.value)}
                    placeholder="例如：6.5"
                    className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-stone-600 mb-1.5">品種</label>
                <input
                  type="text"
                  value={breed}
                  onChange={e => setBreed(e.target.value)}
                  placeholder="例如：柴犬、黃金獵犬"
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-stone-600 mb-1.5">醫療 / 個性備註</label>
                <textarea
                  value={medicalNotes}
                  onChange={e => setMedicalNotes(e.target.value)}
                  placeholder="備註這隻寵物特別需要注意的狀況或過敏源..."
                  rows={3}
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 focus:outline-none focus:ring-2 focus:ring-orange-500/50 resize-none text-sm"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-stone-100 mt-6">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 border border-stone-200 text-stone-600 font-bold rounded-2xl hover:bg-stone-50 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold rounded-2xl hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2 shadow-sm"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                  儲存並新增
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

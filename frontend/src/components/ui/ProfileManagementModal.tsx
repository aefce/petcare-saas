import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, PawPrint, Trash2, Edit2, Check, ShieldAlert, Loader2 } from 'lucide-react';
import apiClient from '../../api/client';
import { useAuthStore } from '../../store/authStore';

interface ProfileManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  pets: any[];
  onRefreshPets: () => void;
  onOpenVaccineHistory: (petId: string, petName: string) => void;
}

export function ProfileManagementModal({
  isOpen,
  onClose,
  pets,
  onRefreshPets,
  onOpenVaccineHistory
}: ProfileManagementModalProps) {
  const { account, setAuth } = useAuthStore();
  
  // Profile state
  const [profileName, setProfileName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState({ text: '', isError: false });

  // Pet Editing state
  const [editingPetId, setEditingPetId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editSpecies, setEditSpecies] = useState('Dog');
  const [editBreed, setEditBreed] = useState('');
  const [editWeight, setEditWeight] = useState('');
  const [editMedicalNotes, setEditMedicalNotes] = useState('');
  const [isSavingPet, setIsSavingPet] = useState(false);
  const [petError, setPetError] = useState('');

  // Fetch/Sync profile details from store or api
  useEffect(() => {
    if (isOpen) {
      fetchProfile();
    }
  }, [isOpen]);

  const fetchProfile = async () => {
    try {
      const res = await apiClient.get('/api/auth/me');
      setProfileName(res.data.name || '');
      setProfilePhone(res.data.phone || '');
      
      // Update local storage/zustand auth state with current name and phone
      if (account) {
        setAuth(useAuthStore.getState().token || '', {
          ...account,
          name: res.data.name,
          phone: res.data.phone
        });
      }
    } catch (err) {
      console.error('Failed to fetch profile info', err);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim() || !profilePhone.trim()) {
      setProfileMessage({ text: '姓名與電話不能為空', isError: true });
      return;
    }

    try {
      setIsSavingProfile(true);
      setProfileMessage({ text: '', isError: false });
      await apiClient.put('/api/auth/profile', {
        name: profileName.trim(),
        phone: profilePhone.trim()
      });
      setProfileMessage({ text: '個人資料更新成功！', isError: false });
      fetchProfile();
    } catch (err: any) {
      console.error(err);
      setProfileMessage({ text: err.response?.data?.detail || '更新失敗，請檢查電話號碼是否重複', isError: true });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const startEditPet = (pet: any) => {
    setEditingPetId(pet.id);
    setEditName(pet.name);
    setEditSpecies(pet.species);
    setEditBreed(pet.breed || '');
    setEditWeight(pet.weight_kg ? pet.weight_kg.toString() : '');
    setEditMedicalNotes(pet.medical_notes || '');
    setPetError('');
  };

  const handleSavePet = async (petId: string) => {
    if (!editName.trim()) {
      setPetError('寵物名字不能為空');
      return;
    }

    try {
      setIsSavingPet(true);
      setPetError('');
      await apiClient.put(`/api/booking/pets/${petId}`, {
        name: editName.trim(),
        species: editSpecies,
        breed: editBreed.trim() || null,
        weight_kg: editWeight ? parseFloat(editWeight) : null,
        medical_notes: editMedicalNotes.trim() || null,
      });
      setEditingPetId(null);
      onRefreshPets();
    } catch (err: any) {
      console.error(err);
      setPetError(err.response?.data?.detail || '修改寵物資料失敗');
    } finally {
      setIsSavingPet(false);
    }
  };

  const handleDeletePet = async (petId: string, petName: string) => {
    if (!window.confirm(`確定要刪除毛小孩「${petName}」嗎？這將無法復原！`)) {
      return;
    }

    try {
      await apiClient.delete(`/api/booking/pets/${petId}`);
      onRefreshPets();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.detail || '刪除失敗');
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
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white rounded-3xl p-6 z-50 shadow-2xl overflow-y-auto max-h-[90vh]"
          >
            <div className="flex justify-between items-center pb-4 border-b border-stone-100 mb-6">
              <h2 className="text-2xl font-bold text-stone-800 flex items-center gap-2">
                <User className="w-6 h-6 text-indigo-600" />
                管理個人檔案與毛小孩
              </h2>
              <button onClick={onClose} className="p-2 text-stone-400 hover:text-stone-600 rounded-full hover:bg-stone-100 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-8">
              {/* Profile Fields Section */}
              <section className="bg-stone-50 p-5 rounded-2xl border border-stone-100">
                <h3 className="text-lg font-bold text-stone-800 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-stone-500" />
                  個人資料設定
                </h3>
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  {profileMessage.text && (
                    <div className={`p-3 rounded-xl text-sm font-medium ${profileMessage.isError ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                      {profileMessage.text}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-stone-500 mb-1">姓名</label>
                      <input
                        type="text"
                        value={profileName}
                        onChange={e => setProfileName(e.target.value)}
                        placeholder="請輸入姓名"
                        className="w-full px-4 py-2 bg-white border border-stone-200 rounded-xl text-stone-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-500 mb-1">手機號碼</label>
                      <input
                        type="tel"
                        value={profilePhone}
                        onChange={e => setProfilePhone(e.target.value)}
                        placeholder="請輸入手機號碼"
                        className="w-full px-4 py-2 bg-white border border-stone-200 rounded-xl text-stone-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isSavingProfile}
                      className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl text-sm hover:bg-indigo-700 transition flex items-center gap-2 shadow-sm"
                    >
                      {isSavingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      儲存變更
                    </button>
                  </div>
                </form>
              </section>

              {/* Pets Management Section */}
              <section className="space-y-4">
                <h3 className="text-lg font-bold text-stone-800 flex items-center gap-2">
                  <PawPrint className="w-5 h-5 text-stone-500" />
                  毛小孩管理
                </h3>

                {pets.length === 0 ? (
                  <p className="text-stone-500 text-sm text-center py-6">目前沒有登記毛小孩。</p>
                ) : (
                  <div className="space-y-4">
                    {pets.map(pet => (
                      <div key={pet.id} className="border border-stone-100 p-4 rounded-2xl bg-white shadow-sm flex flex-col gap-4">
                        {editingPetId === pet.id ? (
                          // Edit Form inside List
                          <div className="space-y-3">
                            {petError && (
                              <div className="bg-red-50 text-red-600 p-2.5 rounded-lg text-xs font-medium">
                                {petError}
                              </div>
                            )}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              <input
                                type="text"
                                value={editName}
                                onChange={e => setEditName(e.target.value)}
                                placeholder="名字"
                                className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              />
                              <select
                                value={editSpecies}
                                onChange={e => setEditSpecies(e.target.value)}
                                className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              >
                                <option value="Dog">狗狗</option>
                                <option value="Cat">貓咪</option>
                                <option value="Other">其他</option>
                              </select>
                              <input
                                type="text"
                                value={editBreed}
                                onChange={e => setEditBreed(e.target.value)}
                                placeholder="品種"
                                className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              />
                              <input
                                type="number"
                                step="0.1"
                                value={editWeight}
                                onChange={e => setEditWeight(e.target.value)}
                                placeholder="體重 (kg)"
                                className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              />
                            </div>
                            <input
                              type="text"
                              value={editMedicalNotes}
                              onChange={e => setEditMedicalNotes(e.target.value)}
                              placeholder="備註"
                              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <div className="flex justify-end gap-2 text-xs">
                              <button
                                onClick={() => setEditingPetId(null)}
                                className="px-3 py-2 border border-stone-200 text-stone-600 rounded-lg hover:bg-stone-50"
                              >
                                取消
                              </button>
                              <button
                                onClick={() => handleSavePet(pet.id)}
                                disabled={isSavingPet}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-1 font-medium"
                              >
                                {isSavingPet ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                                儲存
                              </button>
                            </div>
                          </div>
                        ) : (
                          // View Details and Action Buttons
                          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                            <div className="flex items-center gap-3">
                              {pet.avatar_url ? (
                                <img src={pet.avatar_url} alt={pet.name} className="w-12 h-12 rounded-xl object-cover border border-stone-200" />
                              ) : (
                                <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center font-bold text-lg">
                                  {pet.name.charAt(0)}
                                </div>
                              )}
                              <div>
                                <h4 className="font-bold text-stone-800 flex items-center gap-2">
                                  {pet.name}
                                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${pet.is_vaccine_valid ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/50' : 'bg-rose-50 text-rose-600 border border-rose-200/50'}`}>
                                    {pet.is_vaccine_valid ? '💉 疫苗合規' : '❌ 疫苗不合規'}
                                  </span>
                                </h4>
                                <p className="text-xs text-stone-500">
                                  {pet.species === 'Dog' ? '狗狗' : pet.species === 'Cat' ? '貓咪' : '其他'} • {pet.breed || '混種'} • {pet.weight_kg || '未知'} kg
                                </p>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
                              <button
                                onClick={() => onOpenVaccineHistory(pet.id, pet.name)}
                                className="px-3 py-1.5 bg-orange-50 text-orange-600 hover:bg-orange-100 rounded-lg text-xs font-bold transition-colors"
                              >
                                💉 疫苗管理
                              </button>
                              <button
                                onClick={() => startEditPet(pet)}
                                className="p-1.5 text-stone-400 hover:text-indigo-600 hover:bg-stone-50 rounded-lg transition"
                                title="編輯資料"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeletePet(pet.id, pet.name)}
                                className="p-1.5 text-stone-400 hover:text-red-500 hover:bg-stone-50 rounded-lg transition"
                                title="刪除寵物"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

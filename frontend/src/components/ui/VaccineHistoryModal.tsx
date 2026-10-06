import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, FileText, Upload, CheckCircle, Clock, AlertTriangle, AlertCircle, Loader2 } from 'lucide-react';
import apiClient from '../../api/client';

interface VaccineHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  petId: string;
  petName: string;
  onSuccess?: () => void;
}

interface VaccineRecord {
  id: string;
  vaccine_name: string;
  status: 'PENDING' | 'VALID' | 'EXPIRING_SOON' | 'REJECTED' | 'EXPIRED';
  expiry_date: string;
  file_url: string | null;
  uploaded_at: string;
}

export function VaccineHistoryModal({
  isOpen,
  onClose,
  petId,
  petName,
  onSuccess
}: VaccineHistoryModalProps) {
  const [records, setRecords] = useState<VaccineRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Upload form state
  const [vaccineName, setVaccineName] = useState('狂犬病');
  const [customVaccineName, setCustomVaccineName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen && petId) {
      fetchRecords();
    }
  }, [isOpen, petId]);

  const fetchRecords = async () => {
    try {
      setIsLoading(true);
      const res = await apiClient.get(`/api/booking/pets/${petId}/vaccines`);
      setRecords(res.data);
    } catch (err) {
      console.error('Failed to fetch vaccine records', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadError('請選擇要上傳的證明檔案/照片');
      return;
    }
    if (!expiryDate) {
      setUploadError('請選擇疫苗的過期日期');
      return;
    }

    const finalVaccineName = vaccineName === '其他' ? customVaccineName.trim() : vaccineName;
    if (!finalVaccineName) {
      setUploadError('請輸入疫苗名稱');
      return;
    }

    const formData = new FormData();
    formData.append('vaccine_name', finalVaccineName);
    formData.append('expiry_date', expiryDate);
    formData.append('file', selectedFile);

    try {
      setIsUploading(true);
      setUploadError('');
      setUploadSuccess(false);

      await apiClient.post(`/api/booking/pets/${petId}/vaccines`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setUploadSuccess(true);
      setSelectedFile(null);
      setExpiryDate('');
      setCustomVaccineName('');
      if (fileInputRef.current) fileInputRef.current.value = '';

      // Refresh list
      fetchRecords();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error(err);
      setUploadError(err.response?.data?.detail || '上傳失敗，請稍後再試');
    } finally {
      setIsUploading(false);
    }
  };

  const getStatusBadge = (status: VaccineRecord['status']) => {
    const configs = {
      PENDING: { bg: 'bg-amber-50 text-amber-600 border-amber-200', label: '待審核', icon: Clock },
      VALID: { bg: 'bg-emerald-50 text-emerald-600 border-emerald-200', label: '有效', icon: CheckCircle },
      EXPIRING_SOON: { bg: 'bg-orange-50 text-orange-600 border-orange-200', label: '即將過期', icon: AlertTriangle },
      REJECTED: { bg: 'bg-rose-50 text-rose-600 border-rose-200', label: '已駁回', icon: AlertCircle },
      EXPIRED: { bg: 'bg-stone-100 text-stone-500 border-stone-300', label: '已過期', icon: AlertCircle },
    };

    const config = configs[status] || configs.PENDING;
    const Icon = config.icon;

    return (
      <span className={`px-2.5 py-1 text-xs font-bold rounded-lg border flex items-center gap-1.5 ${config.bg}`}>
        <Icon className="w-3.5 h-3.5" />
        {config.label}
      </span>
    );
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
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
                <FileText className="w-6 h-6 text-orange-500" />
                疫苗證明管理 ({petName})
              </h2>
              <button onClick={onClose} className="p-2 text-stone-400 hover:text-stone-600 rounded-full hover:bg-stone-100 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column: Upload Form */}
              <section className="bg-stone-50 p-5 rounded-2xl border border-stone-100 h-fit">
                <h3 className="text-lg font-bold text-stone-800 mb-4 flex items-center gap-2">
                  <Upload className="w-5 h-5 text-stone-500" />
                  上傳新疫苗證明
                </h3>
                <form onSubmit={handleUploadSubmit} className="space-y-4">
                  {uploadError && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-medium">
                      {uploadError}
                    </div>
                  )}
                  {uploadSuccess && (
                    <div className="bg-emerald-50 text-emerald-600 p-3 rounded-xl text-sm font-medium">
                      疫苗憑證上傳成功，等待管理員審核！
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-bold text-stone-600 mb-1.5">疫苗名稱</label>
                    <select
                      value={vaccineName}
                      onChange={e => setVaccineName(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-stone-200 rounded-xl text-stone-800 focus:outline-none focus:ring-2 focus:ring-orange-500/50 text-sm"
                    >
                      <option value="狂犬病">狂犬病 (Rabies)</option>
                      <option value="犬五合一">犬五合一 (Canine 5-in-1)</option>
                      <option value="貓三合一">貓三合一 (Feline 3-in-1)</option>
                      <option value="其他">其他...</option>
                    </select>
                  </div>

                  {vaccineName === '其他' && (
                    <div>
                      <label className="block text-sm font-bold text-stone-600 mb-1.5">請輸入疫苗名稱</label>
                      <input
                        type="text"
                        value={customVaccineName}
                        onChange={e => setCustomVaccineName(e.target.value)}
                        placeholder="例如：貓五合一"
                        className="w-full px-4 py-2.5 bg-white border border-stone-200 rounded-xl text-stone-800 focus:outline-none focus:ring-2 focus:ring-orange-500/50 text-sm"
                        required
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-bold text-stone-600 mb-1.5">過期日期 (即失效日)</label>
                    <input
                      type="date"
                      value={expiryDate}
                      onChange={e => setExpiryDate(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-stone-200 rounded-xl text-stone-800 focus:outline-none focus:ring-2 focus:ring-orange-500/50 text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-stone-600 mb-1.5">上傳證明檔案 (照片或文件)</label>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden"
                      required
                    />
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-stone-300 rounded-2xl p-4 text-center cursor-pointer hover:border-orange-400 hover:bg-stone-100/50 transition-all flex flex-col items-center justify-center gap-2"
                    >
                      <Upload className="w-8 h-8 text-stone-400" />
                      <span className="text-xs font-bold text-stone-500">
                        {selectedFile ? selectedFile.name : '點擊選擇檔案 (PDF 或 圖片)'}
                      </span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isUploading}
                    className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold rounded-2xl hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2 text-sm shadow-sm"
                  >
                    {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    確認並上傳證明
                  </button>
                </form>
              </section>

              {/* Right Column: Vaccine History List */}
              <section className="space-y-4">
                <h3 className="text-lg font-bold text-stone-800 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-stone-500" />
                  疫苗歷史紀錄
                </h3>

                {isLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
                  </div>
                ) : records.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-stone-200 rounded-2xl text-stone-400 text-sm">
                    尚無上傳紀錄。請先於左側上傳。
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
                    {records.map(record => (
                      <div key={record.id} className="border border-stone-100 p-4 rounded-xl bg-stone-50 flex items-center justify-between gap-4">
                        <div className="space-y-1">
                          <h4 className="font-bold text-stone-800">{record.vaccine_name}</h4>
                          <p className="text-xs text-stone-500">過期日：{formatDate(record.expiry_date)}</p>
                          {record.file_url && (
                            <a 
                              href={record.file_url} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="text-xs text-indigo-600 hover:underline font-bold inline-block"
                            >
                              📄 檢視憑證檔案
                            </a>
                          )}
                        </div>
                        <div>
                          {getStatusBadge(record.status)}
                        </div>
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

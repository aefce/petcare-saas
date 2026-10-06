import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, FileCheck, ShieldAlert, AlertTriangle, ExternalLink, Loader2 } from 'lucide-react';
import apiClient from '../../api/client';

interface VaccineAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface PendingRecord {
  id: string;
  pet_id: string;
  vaccine_name: string;
  status: string;
  expiry_date: string;
  file_url: string | null;
  uploaded_at: string;
}

export function VaccineAuditModal({
  isOpen,
  onClose,
  onSuccess
}: VaccineAuditModalProps) {
  const [records, setRecords] = useState<PendingRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actingRecordId, setActingRecordId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchPendingRecords();
    }
  }, [isOpen]);

  const fetchPendingRecords = async () => {
    try {
      setIsLoading(true);
      const res = await apiClient.get('/api/booking/vaccines/pending');
      setRecords(res.data);
    } catch (err) {
      console.error('Failed to fetch pending vaccines', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (recordId: string, status: 'VALID' | 'REJECTED') => {
    try {
      setActingRecordId(recordId);
      await apiClient.post(`/api/booking/vaccines/${recordId}/verify`, { status });
      
      // Update state local list
      setRecords(prev => prev.filter(r => r.id !== recordId));
      
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Failed to verify vaccine', err);
      alert('審核操作失敗，請稍後再試');
    } finally {
      setActingRecordId(null);
    }
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
                <FileCheck className="w-6 h-6 text-indigo-600" />
                疫苗證明審核中心
              </h2>
              <button onClick={onClose} className="p-2 text-stone-400 hover:text-stone-600 rounded-full hover:bg-stone-100 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
              </div>
            ) : records.length === 0 ? (
              <div className="text-center py-20 text-stone-400 space-y-2">
                <p className="text-lg font-bold">🎉 太棒了！目前沒有待審核的疫苗證明</p>
                <p className="text-sm">所有提交的資料皆已處理完畢。</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                {records.map(record => (
                  <div key={record.id} className="border border-stone-150 p-5 rounded-2xl bg-stone-50 flex flex-col md:flex-row justify-between gap-6 shadow-sm">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-md font-bold">待審核</span>
                        <h4 className="font-bold text-stone-800 text-lg">{record.vaccine_name}</h4>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm text-stone-600">
                        <div>
                          <span className="font-medium text-stone-400 text-xs block">失效日期</span>
                          <span className="font-bold text-stone-800">{formatDate(record.expiry_date)}</span>
                        </div>
                        <div>
                          <span className="font-medium text-stone-400 text-xs block">上傳時間</span>
                          <span className="text-stone-700">{formatDate(record.uploaded_at)}</span>
                        </div>
                      </div>

                      {record.file_url && (
                        <div className="pt-2">
                          <a 
                            href={record.file_url} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-bold bg-white px-3 py-1.5 rounded-lg border border-stone-200 shadow-sm transition"
                          >
                            檢視疫苗證明文件/照片 <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      )}
                    </div>

                    <div className="flex md:flex-col justify-end items-end gap-3 min-w-[140px]">
                      <button
                        onClick={() => handleVerify(record.id, 'VALID')}
                        disabled={actingRecordId !== null}
                        className="flex-1 md:w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-1.5 shadow-sm transition"
                      >
                        {actingRecordId === record.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        審核通過
                      </button>
                      <button
                        onClick={() => handleVerify(record.id, 'REJECTED')}
                        disabled={actingRecordId !== null}
                        className="flex-1 md:w-full py-2.5 bg-rose-50 hover:bg-rose-100 disabled:opacity-50 text-rose-600 border border-rose-200 font-bold rounded-xl text-sm flex items-center justify-center gap-1.5 transition"
                      >
                        {actingRecordId === record.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldAlert className="w-4 h-4" />}
                        駁回審核
                      </button>
                    </div>
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

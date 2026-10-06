import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Settings, Plus, Save, Edit3, ToggleLeft, ToggleRight } from 'lucide-react';
import apiClient from '../../api/client';

interface SystemSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SystemSettingsModal({ isOpen, onClose }: SystemSettingsModalProps) {
  const [services, setServices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  // New Service Form State
  const [isAdding, setIsAdding] = useState(false);
  const [newService, setNewService] = useState({
    name: '',
    description: '',
    duration_minutes: 60,
    price: 1000
  });

  // Edit Service Form State
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    duration_minutes: 60,
    price: 1000
  });

  useEffect(() => {
    if (isOpen) {
      fetchServices();
    }
  }, [isOpen]);

  const fetchServices = async () => {
    try {
      setIsLoading(true);
      const res = await apiClient.get('/api/booking/services');
      setServices(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await apiClient.put(`/api/booking/services/${id}/toggle`);
      fetchServices();
    } catch (error) {
      console.error(error);
      alert("狀態切換失敗");
    }
  };

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/api/booking/services', newService);
      setNewService({ name: '', description: '', duration_minutes: 60, price: 1000 });
      setIsAdding(false);
      fetchServices();
    } catch (error) {
      console.error(error);
      alert("新增失敗");
    }
  };

  const handleSaveEdit = async (id: string) => {
    try {
      await apiClient.put(`/api/booking/services/${id}`, editForm);
      setEditingId(null);
      fetchServices();
    } catch (error) {
      console.error(error);
      alert("儲存失敗");
    }
  };

  const startEdit = (service: any) => {
    setEditingId(service.id);
    setEditForm({
      name: service.name,
      description: service.description || '',
      duration_minutes: service.duration_minutes,
      price: service.price
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
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl max-h-[85vh] overflow-y-auto bg-white rounded-3xl p-6 z-50 shadow-2xl"
          >
            <div className="flex justify-between items-center pb-4 border-b border-stone-100 mb-6">
              <h2 className="text-2xl font-bold text-stone-800 flex items-center gap-2">
                <Settings className="w-6 h-6 text-rose-600" />
                系統設定 (服務項目管理)
              </h2>
              <button onClick={onClose} className="p-2 text-stone-400 hover:text-stone-600 rounded-full hover:bg-stone-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex justify-between items-center mb-4">
              <p className="text-stone-500 text-sm">管理前台可供預約的服務項目、價格與所需時間。</p>
              {!isAdding && (
                <button 
                  onClick={() => setIsAdding(true)}
                  className="bg-rose-50 text-rose-600 px-4 py-2 rounded-xl text-sm font-medium hover:bg-rose-100 transition flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> 新增服務
                </button>
              )}
            </div>

            {/* 新增表單 */}
            {isAdding && (
              <form onSubmit={handleAddService} className="bg-stone-50 p-6 rounded-2xl mb-6 border border-stone-200 shadow-inner">
                <h3 className="font-bold text-stone-800 mb-4">新增服務項目</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-stone-600 mb-1">服務名稱</label>
                    <input required type="text" value={newService.name} onChange={e => setNewService({...newService, name: e.target.value})} className="w-full bg-white border border-stone-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-rose-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-600 mb-1">價格 (NT$)</label>
                    <input required type="number" min="0" value={newService.price} onChange={e => setNewService({...newService, price: Number(e.target.value)})} className="w-full bg-white border border-stone-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-rose-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-600 mb-1">服務時長 (分鐘)</label>
                    <input required type="number" min="15" step="15" value={newService.duration_minutes} onChange={e => setNewService({...newService, duration_minutes: Number(e.target.value)})} className="w-full bg-white border border-stone-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-rose-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-600 mb-1">描述 (選填)</label>
                    <input type="text" value={newService.description} onChange={e => setNewService({...newService, description: e.target.value})} className="w-full bg-white border border-stone-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-rose-500 outline-none" />
                  </div>
                </div>
                <div className="flex gap-3 justify-end">
                  <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 rounded-xl text-sm font-medium text-stone-500 hover:bg-stone-200">取消</button>
                  <button type="submit" className="px-4 py-2 rounded-xl text-sm font-medium bg-rose-600 text-white hover:bg-rose-700 shadow-sm">確認新增</button>
                </div>
              </form>
            )}

            {/* 服務列表 */}
            {isLoading ? (
              <div className="flex justify-center items-center h-32">
                <Loader2 className="w-8 h-8 text-rose-600 animate-spin" />
              </div>
            ) : (
              <div className="space-y-4">
                {services.map((service) => (
                  <div key={service.id} className={`p-4 rounded-2xl border ${service.is_active ? 'bg-white border-stone-200 shadow-sm' : 'bg-stone-50 border-stone-100 opacity-60'}`}>
                    
                    {editingId === service.id ? (
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                        <input type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="col-span-1 bg-stone-50 border border-stone-200 rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-rose-500 outline-none" />
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-stone-500">NT$</span>
                          <input type="number" value={editForm.price} onChange={e => setEditForm({...editForm, price: Number(e.target.value)})} className="w-20 bg-stone-50 border border-stone-200 rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-rose-500 outline-none" />
                        </div>
                        <div className="flex items-center gap-2">
                          <input type="number" step="15" value={editForm.duration_minutes} onChange={e => setEditForm({...editForm, duration_minutes: Number(e.target.value)})} className="w-20 bg-stone-50 border border-stone-200 rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-rose-500 outline-none" />
                          <span className="text-sm text-stone-500">分鐘</span>
                        </div>
                        <div className="flex justify-end gap-2">
                          <button onClick={() => setEditingId(null)} className="px-3 py-1.5 rounded-lg text-sm text-stone-500 hover:bg-stone-100">取消</button>
                          <button onClick={() => handleSaveEdit(service.id)} className="px-3 py-1.5 rounded-lg text-sm bg-rose-600 text-white hover:bg-rose-700 flex items-center gap-1"><Save className="w-4 h-4"/> 儲存</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-bold text-stone-800 flex items-center gap-3">
                            {service.name}
                            {!service.is_active && <span className="bg-stone-200 text-stone-500 text-xs px-2 py-0.5 rounded-md font-normal">已停用</span>}
                          </h3>
                          <div className="flex gap-4 mt-1 text-sm text-stone-500 font-medium">
                            <span>NT$ {service.price.toLocaleString()}</span>
                            <span>•</span>
                            <span>{service.duration_minutes} 分鐘</span>
                            {service.description && (
                              <>
                                <span>•</span>
                                <span className="text-stone-400">{service.description}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => startEdit(service)} className="p-2 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition" title="編輯服務">
                            <Edit3 className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => handleToggle(service.id)}
                            className={`p-2 rounded-xl transition-colors ${service.is_active ? 'text-rose-600 hover:bg-rose-50' : 'text-stone-400 hover:bg-stone-200'}`}
                            title={service.is_active ? "停用此服務" : "啟用此服務"}
                          >
                            {service.is_active ? <ToggleRight className="w-7 h-7" /> : <ToggleLeft className="w-7 h-7" />}
                          </button>
                        </div>
                      </div>
                    )}

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

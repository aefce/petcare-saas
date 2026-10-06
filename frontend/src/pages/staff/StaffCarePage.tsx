import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import apiClient from '../../api/client';
import { GlassCard } from '../../components/ui/GlassCard';
import { ServiceRecordModal } from '../../components/ui/ServiceRecordModal';

export default function StaffCarePage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [recordModalOpen, setRecordModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<{id: string, name: string} | null>(null);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await apiClient.get('/api/execution/tasks');
      setTasks(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleOpenRecordModal = (taskId: string, petName: string) => {
    setSelectedTask({ id: taskId, name: petName });
    setRecordModalOpen(true);
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const styles: Record<string, string> = {
      CONFIRMED: 'bg-emerald-100 text-emerald-700',
      ACTIVE: 'bg-blue-100 text-blue-700',
      COMPLETED: 'bg-stone-100 text-stone-500',
      PENDING: 'bg-amber-100 text-amber-700',
    };
    return (
      <span className={`px-2 py-1 text-xs font-bold rounded-lg ${styles[status] || ''}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-stone-800">照護工作站</h1>
        <p className="text-stone-500 mt-1">管理寵物照護、餵食紀錄與異常狀況回報。</p>
      </div>

      <div className="grid gap-6 grid-cols-1">
        {/* 服務進行中 (ACTIVE) */}
        <GlassCard className="!p-6 bg-white/50 space-y-4 border-t-4 border-t-blue-400">
          <h2 className="font-bold text-lg text-stone-800 flex justify-between items-center">
            目前照護中名單
            <span className="bg-blue-100 text-blue-700 text-sm px-2 py-0.5 rounded-full">
              {tasks.filter(t => t.status === 'ACTIVE').length}
            </span>
          </h2>
          <div className="space-y-4">
            {tasks.filter(t => t.status === 'ACTIVE').map(task => (
              <motion.div layout key={task.id} className="bg-blue-50/50 p-4 rounded-2xl shadow-sm border border-blue-100">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold text-blue-900">{task.pet_name}</span>
                  <StatusBadge status={task.status} />
                </div>
                <p className="text-sm text-blue-700/80 mb-4">{task.service_name}</p>
                
                <div className="flex flex-col gap-2 mb-2">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleOpenRecordModal(task.id, task.pet_name)}
                      className="flex-1 bg-blue-100 text-blue-700 py-2 rounded-lg text-xs font-bold hover:bg-blue-200 transition"
                    >
                      🍖 紀錄餵食
                    </button>
                    <button 
                      onClick={() => handleOpenRecordModal(task.id, task.pet_name)}
                      className="flex-1 bg-teal-100 text-teal-700 py-2 rounded-lg text-xs font-bold hover:bg-teal-200 transition"
                    >
                      🩺 健康檢查
                    </button>
                  </div>
                  <button 
                    onClick={() => handleOpenRecordModal(task.id, task.pet_name)}
                    className="w-full bg-rose-100 text-rose-700 py-2 rounded-lg text-xs font-bold hover:bg-rose-200 transition"
                  >
                    ⚠️ 異常回報
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </GlassCard>
      </div>

      {selectedTask && (
        <ServiceRecordModal 
          isOpen={recordModalOpen}
          onClose={() => setRecordModalOpen(false)}
          bookingId={selectedTask.id}
          petName={selectedTask.name}
          onSuccess={() => {
            alert('服務/異常日誌已成功送出！');
          }}
        />
      )}
    </div>
  );
}

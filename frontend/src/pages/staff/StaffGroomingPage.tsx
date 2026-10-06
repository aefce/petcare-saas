import { useEffect, useState } from 'react';
import { Play } from 'lucide-react';
import { motion } from 'framer-motion';
import apiClient from '../../api/client';
import { GlassCard } from '../../components/ui/GlassCard';
import { ServiceRecordModal } from '../../components/ui/ServiceRecordModal';

export default function StaffGroomingPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [recordModalOpen, setRecordModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<{id: string, name: string} | null>(null);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await apiClient.get('/api/execution/tasks');
      // 可以進一步過濾只有美容服務的 bookings，但這邊簡化處理
      setTasks(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleStartTask = async (id: string) => {
    try {
      await apiClient.post('/api/execution/start', null, { params: { booking_id: id } });
      fetchTasks();
    } catch (error) {
      console.error(error);
      alert("開始服務失敗！");
    }
  };

  const handleCompleteTask = async (id: string) => {
    try {
      await apiClient.post('/api/execution/complete', null, { params: { booking_id: id } });
      alert('已完成美容並通知資深照護員！');
      fetchTasks();
    } catch (error) {
      console.error(error);
      alert("完成服務失敗！");
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
        <h1 className="text-2xl font-bold text-stone-800">美容工作站</h1>
        <p className="text-stone-500 mt-1">管理與執行寵物美容服務。</p>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Column 1: 待我服務 (CONFIRMED) */}
        <GlassCard className="!p-6 bg-white/50 space-y-4 border-t-4 border-t-emerald-400">
          <h2 className="font-bold text-lg text-stone-800 flex justify-between items-center">
            待我服務 (已報到)
            <span className="bg-emerald-100 text-emerald-700 text-sm px-2 py-0.5 rounded-full">
              {tasks.filter(t => t.status === 'CONFIRMED').length}
            </span>
          </h2>
          <div className="space-y-4">
            {tasks.filter(t => t.status === 'CONFIRMED').map(task => (
              <motion.div layout key={task.id} className="bg-white p-4 rounded-2xl shadow-sm border border-stone-100">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold text-stone-800">{task.pet_name}</span>
                  <StatusBadge status={task.status} />
                </div>
                <p className="text-sm text-stone-500 mb-4">{task.service_name}</p>
                <button 
                  onClick={() => handleStartTask(task.id)}
                  className="w-full bg-stone-800 text-white py-2 rounded-lg text-sm font-medium hover:bg-stone-700 transition flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4" /> ✅ 接受任務
                </button>
              </motion.div>
            ))}
          </div>
        </GlassCard>

        {/* Column 2: 服務進行中 (ACTIVE) */}
        <GlassCard className="!p-6 bg-white/50 space-y-4 border-t-4 border-t-blue-400">
          <h2 className="font-bold text-lg text-stone-800 flex justify-between items-center">
            美容進行中
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
                
                <div className="flex gap-2 mb-2">
                  <button 
                    onClick={() => handleOpenRecordModal(task.id, task.pet_name)}
                    className="flex-1 bg-blue-100 text-blue-700 py-2 rounded-lg text-xs font-bold hover:bg-blue-200 transition flex items-center justify-center gap-1"
                  >
                    📷 上傳對比照/紀錄
                  </button>
                  <button 
                    onClick={() => handleCompleteTask(task.id)}
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-xs font-bold hover:bg-blue-700 transition flex items-center justify-center gap-1 shadow-sm shadow-blue-200"
                  >
                    ✨ 完成美容
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
            alert('服務日誌已成功送出！');
          }}
        />
      )}
    </div>
  );
}

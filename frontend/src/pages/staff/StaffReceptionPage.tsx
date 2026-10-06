import { useEffect, useState } from 'react';
import { Users, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import apiClient from '../../api/client';
import { GlassCard } from '../../components/ui/GlassCard';
import { RefundRequestModal } from '../../components/ui/RefundRequestModal';
import { VaccineAuditModal } from '../../components/ui/VaccineAuditModal';
import { UpgradeMemberModal } from '../../components/ui/UpgradeMemberModal';

export default function StaffReceptionPage() {
  const { account } = useAuthStore();
  const [tasks, setTasks] = useState<any[]>([]);
  
  const [refundRequestModalOpen, setRefundRequestModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<{id: string, name: string} | null>(null);
  const [vaccineAuditModalOpen, setVaccineAuditModalOpen] = useState(false);
  const [upgradeMemberModalOpen, setUpgradeMemberModalOpen] = useState(false);

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

  const handleCheckIn = async (id: string) => {
    try {
      await apiClient.post('/api/execution/check-in', null, { params: { booking_id: id } });
      fetchTasks();
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.detail || "確認報到失敗！");
    }
  };

  const handleCheckout = async (id: string) => {
    alert("已完成結帳程序 (Demo)");
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
        <h1 className="text-2xl font-bold text-stone-800">櫃檯作業</h1>
        <p className="text-stone-500 mt-1">負責客戶報到、退費與結帳。</p>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Column 1: 今日預約名單 */}
        <GlassCard className="!p-6 bg-white/50 space-y-4 border-t-4 border-t-amber-400">
          <h2 className="font-bold text-lg text-stone-800 flex justify-between items-center">
            今日預約名單
            <span className="bg-amber-100 text-amber-700 text-sm px-2 py-0.5 rounded-full">
              {tasks.filter(t => t.status === 'PENDING').length}
            </span>
          </h2>
          <button className="w-full bg-amber-100 text-amber-700 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-amber-200 transition border border-amber-200 border-dashed">
            ＋ 散客現場掛號 (Walk-in)
          </button>
          <div className="space-y-4">
            {tasks.filter(t => t.status === 'PENDING').map(task => (
              <motion.div layout key={task.id} className="bg-white p-4 rounded-2xl shadow-sm border border-amber-100">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold text-stone-800">{task.pet_name}</span>
                  <StatusBadge status={task.status} />
                </div>
                <p className="text-sm text-stone-500 mb-4">{task.service_name}</p>
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setVaccineAuditModalOpen(true)}
                      className="flex-1 bg-stone-100 text-stone-600 py-1.5 rounded-lg text-xs font-bold hover:bg-stone-200 transition"
                    >
                      💉 檢查疫苗
                    </button>
                    <button 
                      onClick={() => setUpgradeMemberModalOpen(true)}
                      className="flex-1 bg-teal-50 text-teal-600 py-1.5 rounded-lg text-xs font-bold hover:bg-teal-100 transition"
                    >
                      🏅 升級會員
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleCheckIn(task.id)}
                      className="flex-[2] bg-amber-500 text-white py-2 rounded-lg text-sm font-bold hover:bg-amber-600 transition flex items-center justify-center gap-2"
                    >
                      <Users className="w-4 h-4" /> 確認報到
                    </button>
                    <button 
                      onClick={() => {
                        setSelectedTask({ id: task.id, name: task.pet_name });
                        setRefundRequestModalOpen(true);
                      }}
                      className="flex-[1] bg-rose-50 text-rose-600 py-2 rounded-lg text-sm font-bold hover:bg-rose-100 transition"
                    >
                      退款申請
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </GlassCard>

        {/* Column 2: 服務進行中 (ACTIVE) */}
        <GlassCard className="!p-6 bg-white/50 space-y-4 border-t-4 border-t-blue-400">
          <h2 className="font-bold text-lg text-stone-800 flex justify-between items-center">
            場內服務進度
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
                <p className="text-sm text-blue-700/80 mb-2">{task.service_name}</p>
                <p className="text-xs text-stone-400 text-center mt-2">內部執行中...</p>
              </motion.div>
            ))}
          </div>
        </GlassCard>

        {/* Column 3: 等待接送/結帳 (COMPLETED) */}
        <GlassCard className="!p-6 bg-white/50 space-y-4 border-t-4 border-t-stone-400">
          <h2 className="font-bold text-lg text-stone-800 flex justify-between items-center">
            等待接送 / 結帳
            <span className="bg-stone-200 text-stone-600 text-sm px-2 py-0.5 rounded-full">
              {tasks.filter(t => t.status === 'COMPLETED').length}
            </span>
          </h2>
          <div className="space-y-4">
            {tasks.filter(t => t.status === 'COMPLETED').map(task => (
              <motion.div layout key={task.id} className="bg-stone-50 p-4 rounded-2xl border border-stone-200">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold text-stone-600">{task.pet_name}</span>
                  <StatusBadge status={task.status} />
                </div>
                <p className="text-sm text-stone-400 mb-4">{task.service_name}</p>
                <button 
                  onClick={() => handleCheckout(task.id)}
                  className="w-full bg-stone-800 text-white py-2 rounded-lg text-sm font-medium hover:bg-stone-700 transition flex items-center justify-center gap-2"
                >
                  💳 處理結帳
                </button>
              </motion.div>
            ))}
          </div>
        </GlassCard>
      </div>

      {selectedTask && (
        <RefundRequestModal
          isOpen={refundRequestModalOpen}
          onClose={() => setRefundRequestModalOpen(false)}
          bookingId={selectedTask.id}
          petName={selectedTask.name}
          onSuccess={() => {
            alert('退款申請已送出！');
            fetchTasks();
          }}
        />
      )}

      <VaccineAuditModal
        isOpen={vaccineAuditModalOpen}
        onClose={() => setVaccineAuditModalOpen(false)}
        onSuccess={() => fetchTasks()}
      />

      <UpgradeMemberModal
        isOpen={upgradeMemberModalOpen}
        onClose={() => setUpgradeMemberModalOpen(false)}
        onSuccess={() => fetchTasks()}
      />
    </div>
  );
}

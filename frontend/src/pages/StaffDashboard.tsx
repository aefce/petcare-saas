import { useEffect, useState } from 'react';
import { LogOut, Clock, CheckCircle2, Play, Users, BarChart3, Settings, TrendingUp, AlertCircle, Database, ShieldAlert, Activity, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import apiClient from '../api/client';
import { GlassCard } from '../components/ui/GlassCard';
import { ServiceRecordModal } from '../components/ui/ServiceRecordModal';
import { StaffManagementModal } from '../components/ui/StaffManagementModal';
import { SystemSettingsModal } from '../components/ui/SystemSettingsModal';
import { ReportModal } from '../components/ui/ReportModal';
import { RefundRequestModal } from '../components/ui/RefundRequestModal';
import { RefundApprovalModal } from '../components/ui/RefundApprovalModal';
import { VaccineAuditModal } from '../components/ui/VaccineAuditModal';
import { UpgradeMemberModal } from '../components/ui/UpgradeMemberModal';
import { HotelCheckInModal } from '../components/ui/HotelCheckInModal';
import { HotelCheckOutModal } from '../components/ui/HotelCheckOutModal';
import { HotelDailyLogCreateModal } from '../components/ui/HotelDailyLogCreateModal';
import { HotelDailyLogViewerModal } from '../components/ui/HotelDailyLogViewerModal';


export default function StaffDashboard() {
  const { account, clearAuth } = useAuthStore();
  const userName = account?.name || (account?.email ? account.email.split('@')[0] : 'Staff');
  const dept = account?.department || '系統管理員';

  // Role booleans
  const isReceptionist = dept.includes('櫃檯');
  const isGroomer = dept.includes('美容');
  const isCaretaker = dept.includes('照護');
  const isAdmin = dept.includes('管理') || dept.includes('店長');
  const isStoreManager = dept.includes('店長');
  const isSystemAdmin = dept.includes('系統管理員');

  const [tasks, setTasks] = useState<any[]>([]);
  const [hotelTasks, setHotelTasks] = useState<{ check_ins: any[], check_outs: any[], actives: any[] }>({ check_ins: [], check_outs: [], actives: [] });
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [onlyMyAssigned, setOnlyMyAssigned] = useState(true);
  
  const [hotelCheckInTarget, setHotelCheckInTarget] = useState<any>(null);
  const [hotelCheckInOpen, setHotelCheckInOpen] = useState(false);

  const [hotelCheckOutTarget, setHotelCheckOutTarget] = useState<any>(null);
  const [hotelCheckOutOpen, setHotelCheckOutOpen] = useState(false);

  const [hotelLogCreateTarget, setHotelLogCreateTarget] = useState<any>(null);
  const [hotelLogCreateOpen, setHotelLogCreateOpen] = useState(false);

  const [hotelLogViewerTarget, setHotelLogViewerTarget] = useState<any>(null);
  const [hotelLogViewerOpen, setHotelLogViewerOpen] = useState(false);

  const [staffList, setStaffList] = useState<any[]>([]);
  const [allRooms, setAllRooms] = useState<any[]>([]);
  const [clockLoading, setClockLoading] = useState(false);
  const [pendingRefundCount, setPendingRefundCount] = useState(0);
  const [dailyReport, setDailyReport] = useState<{ total_revenue: number, completed_count: number } | null>(null);

  useEffect(() => {
    // Fetch initial clock status
    const fetchClockStatus = async () => {
      try {
        const res = await apiClient.get('/api/auth/clock/status');
        setIsClockedIn(res.data.is_clocked_in);
      } catch (e) {
        console.error('Failed to get clock status', e);
      }
    };
    fetchClockStatus();
    fetchTasks();
    if (isReceptionist || isCaretaker || isAdmin) {
      fetchHotelTasks();
      fetchStaffList();
      fetchAllRooms();
    }
    if (isAdmin) fetchPendingRefundCount();
    if (isStoreManager) fetchDailyReport();
  }, [isAdmin, isStoreManager, isReceptionist, isCaretaker]);

  const fetchDailyReport = async () => {
    try {
      const res = await apiClient.get('/api/execution/report?period=daily');
      setDailyReport(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchPendingRefundCount = async () => {
    try {
      const res = await apiClient.get('/api/payment/refund/pending');
      setPendingRefundCount(res.data.length);
    } catch (e) {
      console.error(e);
    }
  };

  const handleClockInOut = async () => {
    try {
      setClockLoading(true);
      if (isClockedIn) {
        await apiClient.post('/api/auth/clock/out');
        setIsClockedIn(false);
      } else {
        await apiClient.post('/api/auth/clock/in');
        setIsClockedIn(true);
      }
    } catch (e) {
      console.error('Clock action failed', e);
      alert('打卡失敗，請稍後再試');
    } finally {
      setClockLoading(false);
    }
  };

  // Modal State
  const [recordModalOpen, setRecordModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<{id: string, name: string} | null>(null);
  
  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [refundRequestModalOpen, setRefundRequestModalOpen] = useState(false);
  const [refundApprovalModalOpen, setRefundApprovalModalOpen] = useState(false);
  const [vaccineAuditModalOpen, setVaccineAuditModalOpen] = useState(false);
  const [upgradeMemberModalOpen, setUpgradeMemberModalOpen] = useState(false);


  const fetchTasks = async () => {
    try {
      const res = await apiClient.get('/api/execution/tasks');
      setTasks(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchHotelTasks = async () => {
    try {
      const res = await apiClient.get('/api/hotel/tasks');
      setHotelTasks(res.data);
    } catch (error) {
      console.error("Failed to fetch hotel tasks", error);
    }
  };

  const fetchStaffList = async () => {
    try {
      const res = await apiClient.get('/api/auth/staff');
      setStaffList(res.data.filter((s: any) => s.is_active));
    } catch (e) {
      console.error("Failed to fetch staff list", e);
    }
  };

  const fetchAllRooms = async () => {
    try {
      const roomTypesRes = await apiClient.get('/api/hotel/rooms');
      const roomTypes = roomTypesRes.data;
      const roomsPromises = roomTypes.map((rt: any) =>
        apiClient.get(`/api/hotel/rooms/${rt.id}/physical`).then(res => 
          res.data.map((r: any) => ({ ...r, room_type_name: rt.name }))
        )
      );
      const results = await Promise.all(roomsPromises);
      setAllRooms(results.flat());
    } catch (e) {
      console.error("Failed to fetch all rooms", e);
    }
  };

  const handleLogout = async () => {
    try {
      await apiClient.post("/api/auth/logout");
    } catch (e) {
      console.error(e);
    } finally {
      clearAuth();
      window.location.href = "/login";
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
      fetchTasks();
    } catch (error) {
      console.error(error);
      alert("完成服務失敗！");
    }
  };

  const handleCheckIn = async (id: string) => {
    try {
      await apiClient.post('/api/execution/check-in', null, { params: { booking_id: id } });
      fetchTasks();
    } catch (error) {
      console.error(error);
      alert("確認報到失敗！");
    }
  };

  const handleCheckout = async (id: string) => {
    // We haven't implemented backend checkout yet, so just alert for now
    alert("已完成結帳程序 (Demo)");
    // Optionally fetchTasks if backend handles it
  };

  // Modal-based check-ins and check-outs are handled inside their respective modals

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
    <div className="min-h-screen bg-stone-100 p-6 md:p-12 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-stone-800">員工戰情大腦</h1>
              <span className="px-3 py-1 bg-stone-800 text-white rounded-full text-sm font-medium">
                {dept}
              </span>
            </div>
            <p className="text-stone-500 mt-2">歡迎回來，{userName}。請確認今日的營運狀況。</p>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={handleClockInOut}
              disabled={clockLoading}
              className={`p-4 rounded-2xl flex items-center justify-center gap-3 font-bold text-lg shadow-xl shadow-teal-900/5 hover:-translate-y-1 hover:shadow-2xl hover:shadow-teal-900/10 active:translate-y-0 transition-all duration-300 ${isClockedIn ? 'bg-rose-50 text-rose-600' : 'bg-teal-600 text-white'}`}
            >
              {clockLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Clock className="w-6 h-6" />}
              {isClockedIn ? '下班打卡' : '上班打卡'}
            </button>
            <button onClick={handleLogout} className="p-2.5 rounded-xl text-stone-500 hover:bg-stone-200 transition-colors">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Admin Widgets */}
        {isAdmin && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {isStoreManager && (
                <GlassCard 
                  onClick={() => setReportModalOpen(true)}
                  className="!p-4 flex items-center gap-4 bg-gradient-to-br from-indigo-50 to-white cursor-pointer hover:shadow-md transition"
                >
                  <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl"><BarChart3 className="w-6 h-6" /></div>
                  <div><p className="font-bold text-stone-800">營業報表</p><p className="text-sm text-stone-500">查看本月營收</p></div>
                </GlassCard>
              )}
              
              <GlassCard 
                onClick={() => setStaffModalOpen(true)}
                className="!p-4 flex items-center gap-4 bg-gradient-to-br from-teal-50 to-white cursor-pointer hover:shadow-md transition"
              >
                <div className="p-3 bg-teal-100 text-teal-600 rounded-xl"><Users className="w-6 h-6" /></div>
                <div><p className="font-bold text-stone-800">員工管理</p><p className="text-sm text-stone-500">排班與權限設定</p></div>
              </GlassCard>

              <GlassCard 
                onClick={() => setRefundApprovalModalOpen(true)}
                className="!p-4 flex items-center gap-4 bg-gradient-to-br from-rose-50 to-white cursor-pointer hover:shadow-md transition relative"
              >
                <div className="p-3 bg-rose-100 text-rose-600 rounded-xl relative">
                  <span className="text-xl">💰</span>
                  {pendingRefundCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-rose-600 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full animate-bounce shadow-lg shadow-rose-600/50">
                      {pendingRefundCount}
                    </span>
                  )}
                </div>
                <div><p className="font-bold text-stone-800">退費審核</p><p className="text-sm text-stone-500">人工審查異常退款</p></div>
              </GlassCard>
            </div>
            
            {isSystemAdmin && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 mt-[-1rem]">
                <GlassCard 
                  onClick={() => setSettingsModalOpen(true)}
                  className="!p-4 flex items-center gap-4 bg-gradient-to-br from-stone-50 to-white cursor-pointer hover:shadow-md transition"
                >
                  <div className="p-3 bg-stone-100 text-stone-600 rounded-xl"><Settings className="w-6 h-6" /></div>
                  <div><p className="font-bold text-stone-800">系統設定</p><p className="text-sm text-stone-500">修改服務與價格</p></div>
                </GlassCard>
              </div>
            )}
          </>
        )}

        {/* Kanban Board */}
        <div className={`grid gap-6 ${isReceptionist ? 'grid-cols-1 lg:grid-cols-3' : isGroomer ? 'grid-cols-1 lg:grid-cols-2' : isCaretaker ? 'grid-cols-1' : 'hidden'}`}>
          
          {/* ========== Receptionist View (櫃檯視角) ========== */}
          {isReceptionist && (
            <>
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
                            title="退款申請"
                          >
                            退款申請
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </GlassCard>
            </>
          )}

          {/* ========== Groomer View (美容師視角) ========== */}
          {isGroomer && (
            <>
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
            </>
          )}

          {/* ========== Common: 服務進行中 (ACTIVE) ========== */}
          {/* Visible to operational roles (Caretaker focuses only on this, Groomer works on this, Receptionist monitors this) */}
          {(isGroomer || isCaretaker || isReceptionist) && (
            <GlassCard className="!p-6 bg-white/50 space-y-4 border-t-4 border-t-blue-400">
              <h2 className="font-bold text-lg text-stone-800 flex justify-between items-center">
                {isCaretaker ? '目前照護中名單' : isReceptionist && !isGroomer ? '場內服務進度' : '服務進行中'}
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
                    
                    {isGroomer && (
                      <div className="flex gap-2 mb-2">
                        <button 
                          onClick={() => handleOpenRecordModal(task.id, task.pet_name)}
                          className="flex-1 bg-blue-100 text-blue-700 py-2 rounded-lg text-xs font-bold hover:bg-blue-200 transition flex items-center justify-center gap-1"
                        >
                          📷 上傳對比照
                        </button>
                        <button 
                          onClick={() => handleCompleteTask(task.id)}
                          className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-xs font-bold hover:bg-blue-700 transition flex items-center justify-center gap-1 shadow-sm shadow-blue-200"
                        >
                          ✨ 完成美容
                        </button>
                      </div>
                    )}
                    
                    {isCaretaker && !isGroomer && (
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
                    )}
                    
                    {isReceptionist && !isAdmin && !isGroomer && (
                      <p className="text-xs text-stone-400 text-center mt-2">內部執行中...</p>
                    )}
                  </motion.div>
                ))}
              </div>
            </GlassCard>
          )}

          {/* ========== Receptionist View: 等待接送/結帳 ========== */}
          {isReceptionist && (
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
                      💳 處理結帳 (Payment)
                    </button>
                  </motion.div>
                ))}
              </div>
            </GlassCard>
          )}

        </div>

        {/* ========== Pet Hotel Front Desk Board (櫃檯/店長專屬前台看板) ========== */}
        {(isReceptionist || isAdmin) && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-stone-800 tracking-tight flex items-center gap-2">
              <span>🏨 寵物旅館今日房務與房態管理看板</span>
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* 今日預計入住 */}
              <GlassCard className="!p-6 bg-white/50 space-y-4 border-t-4 border-t-orange-500 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <h3 className="font-bold text-lg text-stone-800 flex justify-between items-center">
                  今日預計入住 (CONFIRMED)
                  <span className="bg-orange-100 text-orange-700 text-sm px-2 py-0.5 rounded-full">
                    {hotelTasks.check_ins.length}
                  </span>
                </h3>
                {hotelTasks.check_ins.length === 0 ? (
                  <p className="text-stone-500 text-sm py-4">今日無預計入住的寵物。</p>
                ) : (
                  <div className="space-y-3">
                    {hotelTasks.check_ins.map((hb) => (
                      <div key={hb.id} className="bg-white p-4 rounded-2xl border border-orange-100 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-stone-800">{hb.pet_name}</span>
                            <span className="text-xs px-2 py-0.5 bg-orange-50 text-orange-600 border border-orange-100 rounded font-semibold">{hb.room_type_name}</span>
                          </div>
                          <p className="text-xs text-stone-400 mt-1">住宿區間: {hb.check_in_date} ~ {hb.check_out_date}</p>
                        </div>
                        <button 
                          onClick={() => {
                            setHotelCheckInTarget(hb);
                            setHotelCheckInOpen(true);
                          }}
                          className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-sm active:scale-95 whitespace-nowrap"
                        >
                          辦理入住 Check-In
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </GlassCard>

              {/* 今日預計退房 */}
              <GlassCard className="!p-6 bg-white/50 space-y-4 border-t-4 border-t-blue-500 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <h3 className="font-bold text-lg text-stone-800 flex justify-between items-center">
                  今日預計退房 (ACTIVE)
                  <span className="bg-blue-100 text-blue-700 text-sm px-2 py-0.5 rounded-full">
                    {hotelTasks.check_outs.length}
                  </span>
                </h3>
                {hotelTasks.check_outs.length === 0 ? (
                  <p className="text-stone-500 text-sm py-4">今日無預計退房的寵物。</p>
                ) : (
                  <div className="space-y-3">
                    {hotelTasks.check_outs.map((hb) => (
                      <div key={hb.id} className="bg-white p-4 rounded-2xl border border-blue-100 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-stone-800">{hb.pet_name}</span>
                            <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 border border-blue-100 rounded font-semibold">{hb.room_type_name}</span>
                          </div>
                          <p className="text-xs text-stone-400 mt-1">住宿區間: {hb.check_in_date} ~ {hb.check_out_date}</p>
                        </div>
                        <button 
                          onClick={() => {
                            setHotelCheckOutTarget(hb);
                            setHotelCheckOutOpen(true);
                          }}
                          className="w-full sm:w-auto bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-sm active:scale-95 whitespace-nowrap"
                        >
                          辦理退房 Check-Out
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </GlassCard>

              {/* 目前入住中名單 (actives) - 櫃檯管理版 */}
              <GlassCard className="!p-6 bg-white/50 space-y-4 border-t-4 border-t-teal-500 shadow-[0_8px_30px_rgb(0,0,0,0.04)] lg:col-span-2">
                <h3 className="font-bold text-lg text-stone-800 flex justify-between items-center">
                  場內目前入住中 (ACTIVE) - 房客管理
                  <span className="bg-teal-100 text-teal-700 text-sm px-2 py-0.5 rounded-full">
                    {hotelTasks.actives?.length || 0}
                  </span>
                </h3>
                {(!hotelTasks.actives || hotelTasks.actives.length === 0) ? (
                  <p className="text-stone-500 text-sm py-4">場內目前無入住中的寵物。</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {hotelTasks.actives.map((hb) => (
                      <div key={hb.id} className="bg-white p-4 rounded-2xl border border-teal-100 shadow-sm space-y-3 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-stone-800">{hb.pet_name}</span>
                              <span className="text-xs px-2 py-0.5 bg-teal-50 text-teal-600 border border-teal-100 rounded font-semibold">{hb.room_type_name}</span>
                            </div>
                            <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                              房號: {hb.assigned_room_number || '未分配'}
                            </span>
                          </div>
                          <p className="text-xs text-stone-400 mt-1">住宿區間: {hb.check_in_date} ~ {hb.check_out_date}</p>
                          <p className="text-xs text-stone-500 mt-1">
                            負責照護: <span className="font-semibold text-stone-700">{hb.assigned_staff_name || '未指派'}</span>
                          </p>
                        </div>

                        <div className="flex flex-col gap-2 pt-2 border-t border-stone-100">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-stone-500 shrink-0">指派人員:</span>
                            <select
                              value={staffList.find(s => s.full_name === hb.assigned_staff_name)?.id || ''}
                              onChange={async (e) => {
                                try {
                                  await apiClient.put(`/api/hotel/bookings/${hb.id}/assign`, null, {
                                    params: { staff_id: e.target.value }
                                  });
                                  alert('負責照護員指派成功！');
                                  fetchHotelTasks();
                                } catch (err: any) {
                                  alert(err.response?.data?.detail || '指派失敗');
                                }
                              }}
                              className="flex-1 bg-stone-50 border border-stone-200 rounded-lg px-2 py-1 text-xs text-stone-700 focus:outline-none focus:ring-1 focus:ring-teal-400"
                            >
                              <option value="">-- 指派照護員 --</option>
                              {staffList.map(s => (
                                <option key={s.id} value={s.id}>{s.full_name} ({s.department || '無部門'})</option>
                              ))}
                            </select>
                          </div>
                          <div className="flex gap-2 pt-1">
                            <button
                              onClick={() => {
                                setHotelLogViewerTarget(hb);
                                setHotelLogViewerOpen(true);
                              }}
                              className="w-full bg-stone-100 hover:bg-stone-200 text-stone-600 text-xs font-bold py-2 rounded-xl transition border border-stone-200"
                            >
                              📋 查看歷史日誌
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </GlassCard>

              {/* 實體房間狀態控制台 (櫃檯/店長專屬) */}
              <GlassCard className="!p-6 bg-white/50 space-y-4 border-t-4 border-t-purple-500 shadow-[0_8px_30px_rgb(0,0,0,0.04)] lg:col-span-2">
                <h3 className="font-bold text-lg text-stone-800 flex justify-between items-center">
                  🏨 實體房間狀態控制台 (櫃檯/店長專屬)
                  <span className="bg-purple-100 text-purple-700 text-sm px-2 py-0.5 rounded-full">
                    {allRooms.length} 間房
                  </span>
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {allRooms.map((room) => (
                    <div key={room.id} className="bg-white p-3.5 rounded-2xl border border-purple-100 shadow-sm flex flex-col justify-between gap-3">
                      <div>
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-stone-800 text-sm">{room.room_number}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            room.status === 'AVAILABLE' ? 'bg-emerald-50 text-emerald-700' :
                            room.status === 'OCCUPIED' ? 'bg-amber-50 text-amber-700' :
                            room.status === 'CLEANING' ? 'bg-blue-50 text-blue-700' :
                            'bg-rose-50 text-rose-700'
                          }`}>
                            {room.status === 'AVAILABLE' ? '空閒' :
                             room.status === 'OCCUPIED' ? '入住中' :
                             room.status === 'CLEANING' ? '清潔中' : '維修中'}
                          </span>
                        </div>
                        <p className="text-[10px] text-stone-400 mt-1">{room.room_type_name}</p>
                      </div>
                      <div>
                        <select
                          value={room.status}
                          onChange={async (e) => {
                            try {
                              await apiClient.put(`/api/hotel/rooms/physical/${room.id}/status`, null, {
                                params: { status_str: e.target.value }
                              });
                              alert('房間狀態變更成功！');
                              fetchAllRooms();
                              fetchHotelTasks();
                            } catch (err: any) {
                              alert(err.response?.data?.detail || '狀態更新失敗');
                            }
                          }}
                          className="w-full bg-stone-50 border border-stone-200 rounded-lg px-2 py-1 text-xs text-stone-700 focus:outline-none"
                        >
                          <option value="AVAILABLE">AVAILABLE (空閒)</option>
                          <option value="CLEANING">CLEANING (清潔)</option>
                          <option value="MAINTENANCE">MAINTENANCE (維修)</option>
                          <option value="OCCUPIED" disabled>OCCUPIED (入住)</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>

            </div>
          </div>
        )}

        {/* ========== Pet Hotel Caretaker Board (照護員/店長專屬工作板) ========== */}
        {(isCaretaker || isAdmin) && (
          <div className="space-y-6 mt-8">
            <h2 className="text-2xl font-bold text-stone-800 tracking-tight flex items-center gap-2">
              <span>🧼 寵物照護與房務清潔工作板</span>
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* 我負責的房客照護 (ACTIVE) */}
              <GlassCard className="!p-6 bg-white/50 space-y-4 border-t-4 border-t-teal-500 shadow-[0_8px_30px_rgb(0,0,0,0.04)] lg:col-span-2">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                  <h3 className="font-bold text-lg text-stone-800 flex justify-between items-center gap-2">
                    <span>📋 房客照護清單 (ACTIVE)</span>
                    <span className="bg-teal-100 text-teal-700 text-sm px-2 py-0.5 rounded-full">
                      {(hotelTasks.actives || []).filter(hb => !onlyMyAssigned || hb.assigned_staff_name === account?.name).length}
                    </span>
                  </h3>
                  <label className="flex items-center gap-2 text-xs text-stone-500 font-medium cursor-pointer bg-stone-100 hover:bg-stone-200 px-3 py-1.5 rounded-lg border border-stone-200 select-none transition">
                    <input
                      type="checkbox"
                      checked={onlyMyAssigned}
                      onChange={(e) => setOnlyMyAssigned(e.target.checked)}
                      className="rounded border-stone-300 text-teal-600 focus:ring-teal-400"
                    />
                    <span>只顯示指派給我的寵物</span>
                  </label>
                </div>

                {(!hotelTasks.actives || hotelTasks.actives.length === 0) ? (
                  <p className="text-stone-500 text-sm py-4">場內目前無入住中的寵物。</p>
                ) : (
                  <>
                    {hotelTasks.actives.filter(hb => !onlyMyAssigned || hb.assigned_staff_name === account?.name).length === 0 ? (
                      <p className="text-stone-500 text-sm py-6 text-center bg-stone-50 rounded-2xl border border-stone-200 border-dashed">
                        {onlyMyAssigned ? '今日無指派給您的照護對象。' : '無符合條件的房客。'}
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {hotelTasks.actives.filter(hb => !onlyMyAssigned || hb.assigned_staff_name === account?.name).map((hb) => (
                          <div key={hb.id} className="bg-white p-4 rounded-2xl border border-teal-100 shadow-sm space-y-3 flex flex-col justify-between">
                            <div>
                              <div className="flex justify-between items-start">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-stone-800">{hb.pet_name}</span>
                                  <span className="text-xs px-2 py-0.5 bg-teal-50 text-teal-600 border border-teal-100 rounded font-semibold">{hb.room_type_name}</span>
                                </div>
                                <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                                  房號: {hb.assigned_room_number || '未分配'}
                                </span>
                              </div>
                              <p className="text-xs text-stone-400 mt-1">住宿區間: {hb.check_in_date} ~ {hb.check_out_date}</p>
                              <p className="text-xs text-stone-500 mt-1">
                                負責照護: <span className="font-semibold text-stone-700">{hb.assigned_staff_name || '未指派'}</span>
                              </p>
                            </div>

                            <div className="flex gap-2 pt-2 border-t border-stone-100">
                              <button
                                onClick={() => {
                                  setHotelLogCreateTarget(hb);
                                  setHotelLogCreateOpen(true);
                                }}
                                className="flex-1 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold py-2 rounded-xl transition shadow-sm"
                              >
                                📝 填寫今日日誌
                              </button>
                              <button
                                onClick={() => {
                                  setHotelLogViewerTarget(hb);
                                  setHotelLogViewerOpen(true);
                                }}
                                className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-600 text-xs font-bold py-2 rounded-xl transition border border-stone-200"
                              >
                                📋 查看歷史日誌
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </GlassCard>

              {/* 客房清潔工作待辦 */}
              <GlassCard className="!p-6 bg-white/50 space-y-4 border-t-4 border-t-teal-500 shadow-[0_8px_30px_rgb(0,0,0,0.04)] lg:col-span-2">
                <h3 className="font-bold text-lg text-stone-800 flex justify-between items-center">
                  🧼 客房清潔待辦清單
                  <span className="bg-teal-100 text-teal-700 text-sm px-2 py-0.5 rounded-full">
                    {allRooms.filter(r => r.status === 'CLEANING').length} 間待清潔
                  </span>
                </h3>
                {allRooms.filter(r => r.status === 'CLEANING').length === 0 ? (
                  <p className="text-stone-500 text-sm py-4">目前所有房間皆已完成清潔！</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {allRooms.filter(r => r.status === 'CLEANING').map((room) => (
                      <div key={room.id} className="bg-white p-4 rounded-2xl border border-teal-100 shadow-sm flex items-center justify-between gap-4">
                        <div>
                          <span className="font-bold text-stone-800 text-sm">{room.room_number}</span>
                          <p className="text-[10px] text-stone-400 mt-0.5">{room.room_type_name}</p>
                        </div>
                        <button
                          onClick={async () => {
                            try {
                              await apiClient.put(`/api/hotel/rooms/physical/${room.id}/status`, null, {
                                params: { status_str: 'AVAILABLE' }
                              });
                              alert('清潔完成！該房間已重新開放登記。');
                              fetchAllRooms();
                              fetchHotelTasks();
                            } catch (err: any) {
                              alert(err.response?.data?.detail || '狀態更新失敗');
                            }
                          }}
                          className="bg-teal-500 hover:bg-teal-600 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition shadow-sm"
                        >
                          🧼 標記清潔完成
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </GlassCard>

            </div>
          </div>
        )}

        {/* ========== Manager View (店長專屬儀表板) ========== */}
        {isStoreManager && !isReceptionist && !isGroomer && !isCaretaker && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-8">
            <h2 className="text-xl font-black text-stone-800 mb-6 flex items-center gap-2">
              <TrendingUp className="text-indigo-600" />
              今日營運總覽 (Daily Overview)
            </h2>
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
              
              <GlassCard className="!p-6 bg-white/60 space-y-4 border-t-4 border-t-indigo-500 shadow-sm">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-stone-600">今日預估營收</h3>
                  <div className="p-2 bg-indigo-50 rounded-lg"><BarChart3 className="w-5 h-5 text-indigo-500" /></div>
                </div>
                <p className="text-3xl font-black text-stone-800">NT$ {dailyReport?.total_revenue.toLocaleString() || 0}</p>
                <p className="text-xs text-emerald-600 font-bold">已完成 {dailyReport?.completed_count || 0} 單服務</p>
              </GlassCard>

              <GlassCard className="!p-6 bg-white/60 space-y-4 border-t-4 border-t-rose-400 shadow-sm">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-stone-600">待辦審核</h3>
                  <div className="p-2 bg-rose-50 rounded-lg"><AlertCircle className="w-5 h-5 text-rose-500" /></div>
                </div>
                <div className="space-y-3">
                  {pendingRefundCount > 0 ? (
                    <div className="bg-rose-50 p-3 rounded-xl border border-rose-100 flex justify-between items-center">
                      <span className="text-sm font-bold text-rose-800">{pendingRefundCount} 筆退費申請等待核准</span>
                      <button onClick={() => setRefundApprovalModalOpen(true)} className="px-3 py-1.5 bg-rose-500 text-white text-xs font-bold rounded-lg hover:bg-rose-600 transition">立即審核</button>
                    </div>
                  ) : (
                    <p className="text-sm text-stone-400">目前無待審核事項</p>
                  )}
                </div>
              </GlassCard>

              <GlassCard className="!p-6 bg-white/60 space-y-4 border-t-4 border-t-teal-500 shadow-sm">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-stone-600">今日排班動態</h3>
                  <div className="p-2 bg-teal-50 rounded-lg"><Users className="w-5 h-5 text-teal-500" /></div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-stone-600">櫃檯 - 莉莉</span>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs font-bold">執勤中</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-stone-600">美容師 - 傑克</span>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs font-bold">執勤中</span>
                  </div>
                  <button onClick={() => setStaffModalOpen(true)} className="w-full mt-2 py-2 bg-stone-100 text-stone-600 rounded-lg text-xs font-bold hover:bg-stone-200 transition">管理排班表 (updateStaffSchedule)</button>
                </div>
              </GlassCard>

            </div>
          </motion.div>
        )}

        {/* ========== System Admin View (系統管理員儀表板) ========== */}
        {isSystemAdmin && !isReceptionist && !isGroomer && !isCaretaker && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-8">
            <h2 className="text-xl font-black text-stone-800 mb-6 flex items-center gap-2">
              <Activity className="text-blue-600" />
              系統監控中心 (System Admin Dashboard)
            </h2>
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
              
              <GlassCard className="!p-6 bg-white/60 space-y-4 border-t-4 border-t-blue-500 shadow-sm">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-stone-600">系統健康度</h3>
                  <div className="p-2 bg-blue-50 rounded-lg"><Activity className="w-5 h-5 text-blue-500" /></div>
                </div>
                <div className="flex items-end gap-2">
                  <p className="text-3xl font-black text-stone-800">99.9%</p>
                  <p className="text-xs text-stone-500 mb-1">Uptime</p>
                </div>
                <p className="text-xs text-emerald-600 font-bold">● API 延遲: 42ms | DB 延遲: 12ms</p>
              </GlassCard>

              <GlassCard className="!p-6 bg-white/60 space-y-4 border-t-4 border-t-amber-500 shadow-sm">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-stone-600">異常與權限日誌</h3>
                  <div className="p-2 bg-amber-50 rounded-lg"><ShieldAlert className="w-5 h-5 text-amber-500" /></div>
                </div>
                <div className="space-y-2">
                  <div className="text-xs p-2 bg-stone-50 rounded border border-stone-100 font-mono text-stone-600">
                    [14:23] manager@petcare.com 登入成功
                  </div>
                  <div className="text-xs p-2 bg-stone-50 rounded border border-stone-100 font-mono text-stone-600">
                    [10:15] admin@petcare.com 變更系統設定
                  </div>
                </div>
              </GlassCard>

              <GlassCard className="!p-6 bg-white/60 space-y-4 border-t-4 border-t-purple-500 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-bold text-stone-600">資料庫備份</h3>
                    <div className="p-2 bg-purple-50 rounded-lg"><Database className="w-5 h-5 text-purple-500" /></div>
                  </div>
                  <p className="text-xs text-stone-500 mb-4">最後備份時間：2026-06-04 03:00 AM</p>
                </div>
                <button onClick={() => alert('資料庫備份已在背景執行！')} className="w-full bg-purple-600 text-white py-2 rounded-lg text-sm font-bold hover:bg-purple-700 transition shadow-sm shadow-purple-200">
                  立即備份資料庫 (backupDatabase)
                </button>
              </GlassCard>

            </div>
          </motion.div>
        )}

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

      {isAdmin && (
        <>
          <StaffManagementModal
            isOpen={staffModalOpen}
            onClose={() => setStaffModalOpen(false)}
          />
          {isSystemAdmin && (
            <SystemSettingsModal
              isOpen={settingsModalOpen}
              onClose={() => setSettingsModalOpen(false)}
            />
          )}
          {isStoreManager && (
            <ReportModal
              isOpen={reportModalOpen}
              onClose={() => setReportModalOpen(false)}
            />
          )}
        </>
      )}
      {selectedTask && (
        <RefundRequestModal
          isOpen={refundRequestModalOpen}
          onClose={() => setRefundRequestModalOpen(false)}
          bookingId={selectedTask.id}
          petName={selectedTask.name}
          onSuccess={() => {
            alert('退款申請已送出/完成！');
            fetchTasks();
          }}
        />
      )}

      {isAdmin && (
        <RefundApprovalModal
          isOpen={refundApprovalModalOpen}
          onClose={() => setRefundApprovalModalOpen(false)}
          onSuccess={() => {
            fetchPendingRefundCount();
            fetchTasks();
          }}
        />
      )}

      {/* Vaccine Audit Modal */}
      <VaccineAuditModal
        isOpen={vaccineAuditModalOpen}
        onClose={() => setVaccineAuditModalOpen(false)}
        onSuccess={() => fetchTasks()}
      />

      {/* Upgrade Member Modal */}
      <UpgradeMemberModal
        isOpen={upgradeMemberModalOpen}
        onClose={() => setUpgradeMemberModalOpen(false)}
        onSuccess={() => fetchTasks()}
      />

      {/* Hotel Check-In Modal */}
      {hotelCheckInTarget && (
        <HotelCheckInModal
          isOpen={hotelCheckInOpen}
          onClose={() => {
            setHotelCheckInOpen(false);
            setHotelCheckInTarget(null);
          }}
          bookingId={hotelCheckInTarget.id}
          petName={hotelCheckInTarget.pet_name}
          roomTypeId={hotelCheckInTarget.room_type_id || hotelCheckInTarget.room_type?.id}
          roomTypeName={hotelCheckInTarget.room_type_name}
          onSuccess={() => {
            alert('辦理入住成功！寵物已入住。');
            fetchHotelTasks();
          }}
        />
      )}

      {/* Hotel Check-Out Modal */}
      {hotelCheckOutTarget && (
        <HotelCheckOutModal
          isOpen={hotelCheckOutOpen}
          onClose={() => {
            setHotelCheckOutOpen(false);
            setHotelCheckOutTarget(null);
          }}
          bookingId={hotelCheckOutTarget.id}
          petName={hotelCheckOutTarget.pet_name}
          roomTypeName={hotelCheckOutTarget.room_type_name}
          baseFee={hotelCheckOutTarget.total_fee}
          onSuccess={() => {
            alert('辦理退房結帳成功！');
            fetchHotelTasks();
          }}
        />
      )}

      {/* Hotel Daily Log Create Modal */}
      {hotelLogCreateTarget && (
        <HotelDailyLogCreateModal
          isOpen={hotelLogCreateOpen}
          onClose={() => {
            setHotelLogCreateOpen(false);
            setHotelLogCreateTarget(null);
          }}
          bookingId={hotelLogCreateTarget.id}
          petName={hotelLogCreateTarget.pet_name}
          onSuccess={() => {
            alert('每日照護日誌提交成功！');
            fetchHotelTasks();
          }}
        />
      )}

      {/* Hotel Daily Log Viewer Modal */}
      {hotelLogViewerTarget && (
        <HotelDailyLogViewerModal
          isOpen={hotelLogViewerOpen}
          onClose={() => {
            setHotelLogViewerOpen(false);
            setHotelLogViewerTarget(null);
          }}
          bookingId={hotelLogViewerTarget.id}
          petName={hotelLogViewerTarget.pet_name}
        />
      )}
    </div>
  );
}


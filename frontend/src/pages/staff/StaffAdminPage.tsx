import { useEffect, useState } from 'react';
import { BarChart3, Users, Settings, TrendingUp, AlertCircle, Database, ShieldAlert, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import apiClient from '../../api/client';
import { GlassCard } from '../../components/ui/GlassCard';
import { StaffManagementModal } from '../../components/ui/StaffManagementModal';
import { SystemSettingsModal } from '../../components/ui/SystemSettingsModal';
import { ReportModal } from '../../components/ui/ReportModal';
import { RefundApprovalModal } from '../../components/ui/RefundApprovalModal';

export default function StaffAdminPage() {
  const { account } = useAuthStore();
  const dept = account?.department || '系統管理員';

  // Role booleans
  const isAdmin = dept.includes('管理') || dept.includes('店長');
  const isStoreManager = dept.includes('店長');
  const isSystemAdmin = dept.includes('系統管理員');

  // Data state
  const [pendingRefundCount, setPendingRefundCount] = useState(0);
  const [dailyReport, setDailyReport] = useState<{ total_revenue: number, completed_count: number } | null>(null);

  // Modal state
  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [refundApprovalModalOpen, setRefundApprovalModalOpen] = useState(false);

  useEffect(() => {
    if (isAdmin) fetchPendingRefundCount();
    if (isStoreManager) fetchDailyReport();
  }, [isAdmin, isStoreManager]);

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

  // If not admin, show nothing
  if (!isAdmin) {
    return (
      <div className="text-center py-20">
        <p className="text-stone-500 text-lg">您無權限存取此頁面。</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-stone-800">
          {isStoreManager ? '營運決策中心' : '系統維護管理中心'}
        </h1>
        <p className="text-stone-500 mt-1">
          {isStoreManager 
            ? '營業報表、退費審核與系統服務價格設定。' 
            : '系統監控、員工管理、帳號維護、排班與出勤紀錄。'}
        </p>
      </div>

      {/* Admin Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {isStoreManager && (
          <GlassCard 
            onClick={() => setReportModalOpen(true)}
            className="!p-4 flex items-center gap-4 bg-gradient-to-br from-indigo-50 to-white cursor-pointer hover:shadow-md transition"
          >
            <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl"><BarChart3 className="w-6 h-6" /></div>
            <div><p className="font-bold text-stone-800">營業報表</p><p className="text-sm text-stone-500">查看本月營收</p></div>
          </GlassCard>
        )}
        
        {isSystemAdmin && (
          <GlassCard 
            onClick={() => setStaffModalOpen(true)}
            className="!p-4 flex items-center gap-4 bg-gradient-to-br from-teal-50 to-white cursor-pointer hover:shadow-md transition"
          >
            <div className="p-3 bg-teal-100 text-teal-600 rounded-xl"><Users className="w-6 h-6" /></div>
            <div><p className="font-bold text-stone-800">員工管理</p><p className="text-sm text-stone-500">排班與權限設定</p></div>
          </GlassCard>
        )}

        {isStoreManager && (
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
        )}

        {isStoreManager && (
          <GlassCard 
            onClick={() => setSettingsModalOpen(true)}
            className="!p-4 flex items-center gap-4 bg-gradient-to-br from-stone-50 to-white cursor-pointer hover:shadow-md transition"
          >
            <div className="p-3 bg-stone-100 text-stone-600 rounded-xl"><Settings className="w-6 h-6" /></div>
            <div><p className="font-bold text-stone-800">系統設定</p><p className="text-sm text-stone-500">修改服務與價格</p></div>
          </GlassCard>
        )}
      </div>

      {/* ========== Manager View (店長專屬儀表板) ========== */}
      {isStoreManager && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
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
      {isSystemAdmin && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
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

      {/* ===== Modals ===== */}
      {isSystemAdmin && (
        <StaffManagementModal
          isOpen={staffModalOpen}
          onClose={() => setStaffModalOpen(false)}
        />
      )}
      {isStoreManager && (
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
      {isStoreManager && (
        <RefundApprovalModal
          isOpen={refundApprovalModalOpen}
          onClose={() => setRefundApprovalModalOpen(false)}
          onSuccess={() => {
            fetchPendingRefundCount();
          }}
        />
      )}
    </div>
  );
}

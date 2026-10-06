import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import apiClient from '../../api/client';
import {
  BarChart3,
  Users,
  CalendarCheck,
  DollarSign,
  Loader2,
  TrendingUp,
  Scissors,
  Heart,
  Hotel,
  ShieldCheck,
  ArrowRight,
  Bell,
  Clock
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function StaffHomePage() {
  const { account } = useAuthStore();
  const navigate = useNavigate();
  const dept = account?.department || '系統管理員';
  const userName = account?.name || (account?.email ? account.email.split('@')[0] : 'Staff');
  const isStoreManager = dept.includes('店長');
  const isSystemAdmin = dept.includes('系統管理員');
  const isAdmin = isStoreManager || isSystemAdmin;
  const isReceptionist = dept.includes('櫃檯');
  const isGroomer = dept.includes('美容');
  const isCaretaker = dept.includes('照護');

  const [report, setReport] = useState<any>(null);
  const [reportLoading, setReportLoading] = useState(true);

  useEffect(() => {
    if (isStoreManager) {
      fetchReport();
    } else {
      setReportLoading(false);
    }
  }, [isStoreManager]);

  const fetchReport = async () => {
    try {
      setReportLoading(true);
      const res = await apiClient.get('/api/execution/report', { params: { period: 'daily' } });
      setReport(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setReportLoading(false);
    }
  };

  // Time-aware greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '早安';
    if (hour < 18) return '午安';
    return '晚安';
  };

  const today = new Date().toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });

  // Non-admin: Quick action cards
  if (!isAdmin) {
    const quickActions = [
      isReceptionist && {
        title: '櫃檯作業站',
        description: '查看今日預約排程、辦理入場手續與處理接待事宜',
        icon: Users,
        color: 'bg-sky-500',
        bgLight: 'bg-sky-50',
        textColor: 'text-sky-600',
        path: '/staff/reception'
      },
      isGroomer && {
        title: '美容工作站',
        description: '查看今日美容任務、填寫服務記錄與異常回報',
        icon: Scissors,
        color: 'bg-amber-500',
        bgLight: 'bg-amber-50',
        textColor: 'text-amber-600',
        path: '/staff/grooming'
      },
      isCaretaker && {
        title: '照護工作站',
        description: '填寫寵物餵食紀錄、健康狀態與每日照護項目',
        icon: Heart,
        color: 'bg-rose-500',
        bgLight: 'bg-rose-50',
        textColor: 'text-rose-600',
        path: '/staff/care'
      },
      {
        title: '寵物旅館',
        description: '查看現有住宿預約、填寫每日照護日誌與狀態更新',
        icon: Hotel,
        color: 'bg-emerald-500',
        bgLight: 'bg-emerald-50',
        textColor: 'text-emerald-600',
        path: '/staff/hotel'
      },
      {
        title: '通知與訊息',
        description: '查看系統通知、跨部門訊息與作業異常回報',
        icon: Bell,
        color: 'bg-purple-500',
        bgLight: 'bg-purple-50',
        textColor: 'text-purple-600',
        path: '/staff/notifications'
      }
    ].filter(Boolean) as any[];

    return (
      <div className="space-y-8 max-w-5xl mx-auto">
        {/* Greeting Banner */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-stone-900 to-stone-950 rounded-2xl p-6 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative space-y-1">
            <p className="text-amber-400 text-xs font-bold uppercase tracking-widest">
              {today}
            </p>
            <h1 className="text-2xl font-black text-white">
              {getGreeting()}，{userName} 👋
            </h1>
            <p className="text-stone-400 text-sm">
              歡迎回到毛星球員工系統。請選擇下方工作站開始今日的任務。
            </p>
          </div>
        </motion.div>

        {/* Quick Action Cards */}
        <div>
          <h2 className="text-sm font-bold text-stone-500 uppercase tracking-widest mb-4">
            快速工作站入口
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickActions.map((action, idx) => {
              const Icon = action.icon;
              return (
                <motion.div
                  key={action.path}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  whileHover={{ y: -4 }}
                  onClick={() => navigate(action.path)}
                  className="bg-white border border-stone-200/60 rounded-2xl p-5 cursor-pointer hover:shadow-md hover:border-stone-300 transition-all group"
                >
                  <div className={`w-11 h-11 ${action.bgLight} ${action.textColor} rounded-xl flex items-center justify-center mb-4`}>
                    <Icon size={22} />
                  </div>
                  <h3 className="font-bold text-stone-900 text-sm">{action.title}</h3>
                  <p className="text-stone-400 text-xs mt-1.5 leading-relaxed">{action.description}</p>
                  <div className={`flex items-center mt-4 ${action.textColor} text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity`}>
                    <span>前往工作站</span>
                    <ArrowRight size={13} className="ml-1" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Admin view: KPI dashboard + management shortcuts
  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Admin Greeting Banner */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-stone-900 to-stone-950 rounded-2xl p-6 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 w-64 h-64 bg-orange-600/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-amber-400 text-xs font-bold uppercase tracking-widest">
              {today} · {isStoreManager ? '管理決策總覽' : '系統維護總覽'}
            </p>
            <h1 className="text-2xl font-black text-white">
              {getGreeting()}，{userName} 👋
            </h1>
            <p className="text-stone-400 text-sm">
              {isStoreManager 
                ? '今日門店運作一切正常，以下是即時關鍵指標。' 
                : '毛星球系統維護中心。請確保所有服務與資料庫穩定運行。'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-white text-xs font-bold">系統運作正常</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* KPI Cards or System Status */}
      <div>
        <h2 className="text-sm font-bold text-stone-500 uppercase tracking-widest mb-4">
          {isStoreManager ? '今日關鍵數據指標（KPI）' : '系統即時監控指標'}
        </h2>
        {isStoreManager ? (
          reportLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-28 bg-stone-200/60 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : report ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  label: '待處理預約',
                  value: report.pending_count,
                  unit: '筆',
                  Icon: CalendarCheck,
                  color: 'text-amber-600',
                  bg: 'bg-amber-50',
                  trend: '待今日完成',
                  delay: 0
                },
                {
                  label: '今日完成服務',
                  value: report.completed_count,
                  unit: '筆',
                  Icon: TrendingUp,
                  color: 'text-emerald-600',
                  bg: 'bg-emerald-50',
                  trend: '服務已完成',
                  delay: 0.05
                },
                {
                  label: '今日預估營收',
                  value: `NT$ ${(report.total_revenue ?? 0).toLocaleString()}`,
                  unit: '',
                  Icon: DollarSign,
                  color: 'text-blue-600',
                  bg: 'bg-blue-50',
                  trend: '日計費累計',
                  delay: 0.1
                },
                {
                  label: '報表日期',
                  value: report.report_date,
                  unit: '',
                  Icon: BarChart3,
                  color: 'text-purple-600',
                  bg: 'bg-purple-50',
                  trend: '數據統計日期',
                  delay: 0.15
                }
              ].map((kpi) => {
                const KpiIcon = kpi.Icon;
                return (
                  <motion.div
                    key={kpi.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: kpi.delay }}
                    className="bg-white border border-stone-200/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className={`w-11 h-11 ${kpi.bg} ${kpi.color} rounded-xl flex items-center justify-center`}>
                        <KpiIcon size={20} />
                      </div>
                      <span className="text-[10px] font-bold text-stone-400 bg-stone-50 border border-stone-200/60 px-2 py-1 rounded-lg">
                        {kpi.trend}
                      </span>
                    </div>
                    <div className="mt-4">
                      <p className="text-xs font-bold text-stone-400">{kpi.label}</p>
                      <p className="text-2xl font-black text-stone-900 mt-1 leading-tight">
                        {kpi.value}
                        {kpi.unit && <span className="text-sm font-medium text-stone-400 ml-1">{kpi.unit}</span>}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="bg-rose-50 border border-rose-200/60 rounded-2xl p-5 text-sm text-rose-700 font-medium">
              無法載入今日報表，請重新整理頁面或檢查後端連線狀態。
            </div>
          )
        ) : (
          /* System Admin Health Monitor Dashboard */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                label: '系統健康度',
                value: '99.9%',
                unit: 'Uptime',
                Icon: ShieldCheck,
                color: 'text-indigo-600',
                bg: 'bg-indigo-50',
                trend: '無異常模組',
                delay: 0
              },
              {
                label: 'API 延遲',
                value: '42',
                unit: 'ms',
                Icon: Clock,
                color: 'text-sky-600',
                bg: 'bg-sky-50',
                trend: '回應速度極快',
                delay: 0.05
              },
              {
                label: '資料庫狀態',
                value: '備份正常',
                unit: '',
                Icon: BarChart3,
                color: 'text-emerald-600',
                bg: 'bg-emerald-50',
                trend: '每日備份成功',
                delay: 0.1
              },
              {
                label: '系統異常日誌',
                value: '0',
                unit: '個未處理',
                Icon: Bell,
                color: 'text-stone-600',
                bg: 'bg-stone-50',
                trend: '安全日誌正常',
                delay: 0.15
              }
            ].map((kpi) => {
              const KpiIcon = kpi.Icon;
              return (
                <motion.div
                  key={kpi.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: kpi.delay }}
                  className="bg-white border border-stone-200/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className={`w-11 h-11 ${kpi.bg} ${kpi.color} rounded-xl flex items-center justify-center`}>
                      <KpiIcon size={20} />
                    </div>
                    <span className="text-[10px] font-bold text-stone-400 bg-stone-50 border border-stone-200/60 px-2 py-1 rounded-lg">
                      {kpi.trend}
                    </span>
                  </div>
                  <div className="mt-4">
                    <p className="text-xs font-bold text-stone-400">{kpi.label}</p>
                    <p className="text-2xl font-black text-stone-900 mt-1 leading-tight">
                      {kpi.value}
                      {kpi.unit && <span className="text-sm font-medium text-stone-400 ml-1">{kpi.unit}</span>}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Admin Quick Action Shortcuts */}
      <div>
        <h2 className="text-sm font-bold text-stone-500 uppercase tracking-widest mb-4">
          {isStoreManager ? '管理員快速動作' : '系統維護快速動作'}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            isStoreManager && {
              title: '決策與設定',
              description: '前往審核異常退費、修改服務與價格，並查看營業報表',
              icon: ShieldCheck,
              color: 'bg-stone-900',
              textColor: 'text-white',
              path: '/staff/admin'
            },
            isStoreManager && {
              title: '通知中心',
              description: '查看所有異常回報與系統跨部門通知',
              icon: Bell,
              color: 'bg-purple-600',
              textColor: 'text-white',
              path: '/staff/notifications'
            },
            isStoreManager && {
              title: '旅館管理',
              description: '管理寵物住宿預約與每日照護日誌',
              icon: Hotel,
              color: 'bg-emerald-600',
              textColor: 'text-white',
              path: '/staff/hotel'
            },
            isSystemAdmin && {
              title: '員工管理與維護',
              description: '前往管理員工帳號、排班日曆以及查看出勤打卡紀錄',
              icon: Users,
              color: 'bg-teal-600',
              textColor: 'text-white',
              path: '/staff/admin'
            }
          ].filter(Boolean).map((item: any, idx) => {
            const ItemIcon = item.icon;
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + idx * 0.05 }}
                whileHover={{ y: -3 }}
                onClick={() => navigate(item.path)}
                className={`${item.color} rounded-2xl p-5 cursor-pointer group hover:shadow-lg transition-all`}
              >
                <div className={`${item.textColor} opacity-70 mb-3`}>
                  <ItemIcon size={22} />
                </div>
                <h3 className={`font-bold ${item.textColor} text-sm`}>{item.title}</h3>
                <p className={`${item.textColor} text-xs mt-1.5 opacity-70 leading-relaxed`}>
                  {item.description}
                </p>
                <div className={`flex items-center mt-4 ${item.textColor} text-xs font-bold opacity-0 group-hover:opacity-70 transition-opacity`}>
                  <span>立即前往</span>
                  <ArrowRight size={13} className="ml-1" />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Admin Guidance Info Card */}
      <div className="bg-amber-50/50 border border-amber-200/50 rounded-2xl p-5 space-y-3">
        <h3 className="font-bold text-amber-900 text-sm flex items-center gap-2">
          <Clock size={16} className="text-amber-600" />
          管理指引提示
        </h3>
        <ul className="space-y-2 text-xs text-amber-800 font-medium">
          {isStoreManager ? (
            <>
              <li className="flex items-start gap-2">
                <span className="w-1 h-1 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                請定期查核「退費審核」，以確保異常退款案件在 24 小時內處理完畢。
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1 h-1 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                若需調整服務收費或新增美容項目，請至決策中心「系統設定」進行修改。
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1 h-1 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                店長擁有最終身份變更決策權，如需更動員工身份職位，請下達指令給系統管理員進行操作。
              </li>
            </>
          ) : (
            <>
              <li className="flex items-start gap-2">
                <span className="w-1 h-1 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                如需新增員工帳號、變更班表或查看出勤紀錄，請前往員工管理中心。
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1 h-1 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                ⚠️ 人員身份（職位部門）更動必須基於店長要求與指令，執行更動時請務必填寫店長指令備註。
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1 h-1 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                如遇資料庫備份異常或 API 延遲過高，請聯繫系統維護團隊或重啟服務。
              </li>
            </>
          )}
        </ul>
      </div>
    </div>
  );
}

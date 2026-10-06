import { useEffect, useState, useRef } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { 
  LogOut, 
  Clock, 
  Bell, 
  Home, 
  Hotel, 
  ShieldCheck, 
  Loader2, 
  X, 
  Menu, 
  ChevronRight, 
  LayoutDashboard, 
  Scissors, 
  Heart, 
  Check, 
  AlertCircle 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import apiClient from '../../api/client';

interface Notification {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  type?: string;
}

export default function StaffLayout() {
  const { account, token, setAuth, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileName, setProfileName] = useState(account?.name || '');
  const [profilePhone, setProfilePhone] = useState(account?.phone || '');
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    if (account?.name) {
      setProfileName(account.name);
    }
    if (account?.phone) {
      setProfilePhone(account.phone);
    }
  }, [account]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim() || !profilePhone.trim()) {
      showToast('姓名與手機號碼不能為空', 'error');
      return;
    }
    setProfileLoading(true);
    try {
      await apiClient.put('/api/auth/profile', { name: profileName, phone: profilePhone });
      if (account && token) {
        setAuth(token, { ...account, name: profileName, phone: profilePhone });
      }
      showToast('個人資料修改成功！');
      setShowProfileModal(false);
    } catch (e: any) {
      console.error(e);
      showToast('修改個資失敗，請重試', 'error');
    } finally {
      setProfileLoading(false);
    }
  };
  const userName = account?.name || (account?.email ? account.email.split('@')[0] : 'Staff');
  const dept = account?.department || '系統管理員';

  // Role booleans
  const isReceptionist = dept.includes('櫃檯');
  const isGroomer = dept.includes('美容');
  const isCaretaker = dept.includes('照護');
  const isAdmin = dept.includes('管理') || dept.includes('店長');

  // Clock state
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [clockLoading, setClockLoading] = useState(false);

  // Notification state
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Mobile menu control
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Custom Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Show hotel link for receptionist, caretaker, admin
  const showHotelLink = isReceptionist || isCaretaker || isAdmin;
  // Show admin link only for admin roles
  const showAdminLink = isAdmin;

  useEffect(() => {
    fetchClockStatus();
    fetchNotifications();
    // Poll notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowNotifDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchClockStatus = async () => {
    try {
      const res = await apiClient.get('/api/auth/clock/status');
      setIsClockedIn(res.data.is_clocked_in);
    } catch (e) {
      console.error('Failed to get clock status', e);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await apiClient.get('/api/execution/notifications');
      const data: Notification[] = res.data;
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.is_read).length);
    } catch (e) {
      console.error('Failed to fetch notifications', e);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await apiClient.post(`/api/execution/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (e) {
      console.error('Failed to mark notification as read', e);
    }
  };

  const handleClockInOut = async () => {
    try {
      setClockLoading(true);
      if (isClockedIn) {
        await apiClient.post('/api/auth/clock/out');
        setIsClockedIn(false);
        showToast('下班打卡成功！辛苦您了。');
      } else {
        await apiClient.post('/api/auth/clock/in');
        setIsClockedIn(true);
        showToast('上班打卡成功！祝您有順利的一天。');
      }
    } catch (e) {
      console.error('Clock action failed', e);
      showToast('打卡失敗，請重新操作或聯繫管理員', 'error');
    } finally {
      setClockLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await apiClient.post('/api/auth/logout');
    } catch (e) {
      console.error(e);
    } finally {
      clearAuth();
      window.location.href = '/login';
    }
  };

  const sidebarLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200 relative border-l-4 ${
      isActive
        ? 'border-amber-500 bg-white/5 text-amber-400 font-bold shadow-sm'
        : 'border-transparent text-stone-400 hover:text-white hover:bg-white/5'
    }`;

  return (
    <div className="min-h-screen bg-stone-100 flex font-sans text-stone-900 selection:bg-amber-100 overflow-hidden relative">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: '-50%' }}
            animate={{ opacity: 1, y: 24, x: '-50%' }}
            exit={{ opacity: 0, y: -50, x: '-50%' }}
            className={`fixed top-0 left-1/2 -translate-x-1/2 z-50 flex items-center space-x-3 px-5 py-3 rounded-2xl shadow-xl border text-sm font-semibold ${
              toast.type === 'success' 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200/60' 
                : 'bg-rose-50 text-rose-800 border-rose-200/60'
            }`}
          >
            {toast.type === 'success' ? (
              <Check className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== Desktop Sidebar (Stone-900 / Stone-950 Dark Theme) ===== */}
      <aside className="hidden lg:flex flex-col w-64 bg-stone-950 border-r border-stone-850 shrink-0 select-none">
        {/* Brand Header */}
        <div className="p-6 flex items-center space-x-3 border-b border-stone-850">
          <div className="bg-gradient-to-tr from-amber-400 to-orange-500 text-white p-2 rounded-xl">
            <LayoutDashboard size={20} className="transform -rotate-12" />
          </div>
          <div>
            <h2 className="text-sm font-black text-white leading-tight">員工戰情大腦</h2>
            <p className="text-[10px] text-stone-500 font-bold tracking-wider mt-0.5">STAFF PANEL</p>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 px-4 py-6 overflow-y-auto space-y-6">
          {/* Workstations Group */}
          <div className="space-y-1.5">
            <h3 className="px-4 text-[10px] font-bold text-stone-600 uppercase tracking-widest">
              工作站入口
            </h3>
            
            {isAdmin && (
              <NavLink to="/staff" end className={sidebarLinkClass}>
                <Home className="w-4.5 h-4.5" />
                <span>管理總覽</span>
              </NavLink>
            )}

            {isReceptionist && (
              <NavLink to="/staff/reception" className={sidebarLinkClass}>
                <Home className="w-4.5 h-4.5" />
                <span>櫃檯作業站</span>
              </NavLink>
            )}

            {isGroomer && (
              <NavLink to="/staff/grooming" className={sidebarLinkClass}>
                <Home className="w-4.5 h-4.5" />
                <span>美容工作站</span>
              </NavLink>
            )}

            {isCaretaker && (
              <NavLink to="/staff/care" className={sidebarLinkClass}>
                <Home className="w-4.5 h-4.5" />
                <span>照護工作站</span>
              </NavLink>
            )}
          </div>

          {/* Core Business Group */}
          {showHotelLink && (
            <div className="space-y-1.5">
              <h3 className="px-4 text-[10px] font-bold text-stone-600 uppercase tracking-widest">
                業務管理
              </h3>
              <NavLink to="/staff/hotel" className={sidebarLinkClass}>
                <Hotel className="w-4.5 h-4.5" />
                <span>旅館管理</span>
              </NavLink>
            </div>
          )}

          {/* System Control Group */}
          {(showAdminLink || notifications.length >= 0) && (
            <div className="space-y-1.5">
              <h3 className="px-4 text-[10px] font-bold text-stone-600 uppercase tracking-widest">
                系統與訊息
              </h3>
              {showAdminLink && (
                <NavLink to="/staff/admin" className={sidebarLinkClass}>
                  <ShieldCheck className="w-4.5 h-4.5" />
                  <span>管理中心</span>
                </NavLink>
              )}
              <NavLink to="/staff/notifications" className={sidebarLinkClass}>
                <Bell className="w-4.5 h-4.5" />
                <span className="flex-1">訊息中心</span>
                {unreadCount > 0 && (
                  <span className="ml-auto bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </NavLink>
            </div>
          )}
        </div>

        {/* User Card at Sidebar Bottom */}
        <div className="p-4 border-t border-stone-850 bg-stone-950/40">
          <div className="flex items-center space-x-3 p-2 rounded-xl bg-stone-900 border border-stone-800/40">
            <div className="w-10 h-10 rounded-lg bg-stone-800 text-amber-400 flex items-center justify-center font-bold">
              {userName.substring(0, 1).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{userName}</p>
              <div className="flex items-center justify-between mt-1">
                <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 rounded text-[9px] font-bold inline-block">
                  {dept}
                </span>
                <button
                  onClick={() => setShowProfileModal(true)}
                  className="text-stone-500 hover:text-amber-400 text-[10px] font-bold transition-colors"
                >
                  修改個資
                </button>
              </div>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="w-full mt-3 flex items-center justify-center space-x-2 py-2.5 rounded-xl border border-stone-850 text-stone-400 hover:text-red-400 hover:bg-red-500/5 text-xs font-bold transition-all"
          >
            <LogOut size={14} />
            <span>安全登出</span>
          </button>
        </div>
      </aside>

      {/* ===== Mobile Menu Overlay Drawer ===== */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileSidebarOpen(false)}
              className="lg:hidden fixed inset-0 bg-black z-40"
            />
            {/* Menu Panel */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="lg:hidden fixed inset-y-0 left-0 w-72 bg-stone-950 border-r border-stone-900 z-50 flex flex-col justify-between"
            >
              <div>
                <div className="p-6 flex items-center justify-between border-b border-stone-850">
                  <div className="flex items-center space-x-3">
                    <div className="bg-gradient-to-tr from-amber-400 to-orange-500 text-white p-2 rounded-xl">
                      <LayoutDashboard size={20} className="transform -rotate-12" />
                    </div>
                    <div>
                      <h2 className="text-sm font-black text-white leading-tight">員工戰情大腦</h2>
                      <p className="text-[9px] text-stone-500 font-bold tracking-wider mt-0.5">STAFF MOBILE</p>
                    </div>
                  </div>
                  <button onClick={() => setMobileSidebarOpen(false)} className="text-stone-400 hover:text-white">
                    <X size={20} />
                  </button>
                </div>

                <nav className="p-4 space-y-4">
                  <div className="space-y-1">
                    <h3 className="px-4 text-[9px] font-bold text-stone-600 uppercase tracking-widest mb-1">
                      工作站入口
                    </h3>
                    {isAdmin && (
                      <NavLink to="/staff" end onClick={() => setMobileSidebarOpen(false)} className={sidebarLinkClass}>
                        <Home className="w-4 h-4" />
                        <span>管理總覽</span>
                      </NavLink>
                    )}
                    {isReceptionist && (
                      <NavLink to="/staff/reception" onClick={() => setMobileSidebarOpen(false)} className={sidebarLinkClass}>
                        <Home className="w-4 h-4" />
                        <span>櫃檯作業站</span>
                      </NavLink>
                    )}
                    {isGroomer && (
                      <NavLink to="/staff/grooming" onClick={() => setMobileSidebarOpen(false)} className={sidebarLinkClass}>
                        <Home className="w-4 h-4" />
                        <span>美容工作站</span>
                      </NavLink>
                    )}
                    {isCaretaker && (
                      <NavLink to="/staff/care" onClick={() => setMobileSidebarOpen(false)} className={sidebarLinkClass}>
                        <Home className="w-4 h-4" />
                        <span>照護工作站</span>
                      </NavLink>
                    )}
                  </div>

                  {showHotelLink && (
                    <div className="space-y-1">
                      <h3 className="px-4 text-[9px] font-bold text-stone-600 uppercase tracking-widest mb-1">
                        業務管理
                      </h3>
                      <NavLink to="/staff/hotel" onClick={() => setMobileSidebarOpen(false)} className={sidebarLinkClass}>
                        <Hotel className="w-4 h-4" />
                        <span>旅館管理</span>
                      </NavLink>
                    </div>
                  )}

                  <div className="space-y-1">
                    <h3 className="px-4 text-[9px] font-bold text-stone-600 uppercase tracking-widest mb-1">
                      系統與訊息
                    </h3>
                    {showAdminLink && (
                      <NavLink to="/staff/admin" onClick={() => setMobileSidebarOpen(false)} className={sidebarLinkClass}>
                        <ShieldCheck className="w-4 h-4" />
                        <span>管理中心</span>
                      </NavLink>
                    )}
                    <NavLink to="/staff/notifications" onClick={() => setMobileSidebarOpen(false)} className={sidebarLinkClass}>
                      <Bell className="w-4 h-4" />
                      <span className="flex-1">訊息中心</span>
                      {unreadCount > 0 && (
                        <span className="ml-auto bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                          {unreadCount}
                        </span>
                      )}
                    </NavLink>
                  </div>
                </nav>
              </div>

              {/* Mobile Drawer Bottom */}
              <div className="p-4 border-t border-stone-850 bg-stone-950/40">
                <div className="flex items-center space-x-3 p-2 rounded-xl bg-stone-900 border border-stone-800/40">
                  <div className="w-10 h-10 rounded-lg bg-stone-850 text-amber-400 flex items-center justify-center font-bold">
                    {userName.substring(0, 1).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{userName}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 rounded text-[9px] font-bold inline-block">
                        {dept}
                      </span>
                      <button
                        onClick={() => {
                          setMobileSidebarOpen(false);
                          setShowProfileModal(true);
                        }}
                        className="text-stone-500 hover:text-amber-400 text-[10px] font-bold transition-colors"
                      >
                        修改個資
                      </button>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full mt-3 flex items-center justify-center space-x-2 py-2.5 rounded-xl border border-stone-850 text-stone-400 hover:text-red-400 hover:bg-red-500/5 text-xs font-bold transition-all"
                >
                  <LogOut size={14} />
                  <span>安全登出</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ===== Main Content Area (Fixed layout topbar + subpages) ===== */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Topbar of Staff Management Page */}
        <header className="h-16 border-b border-stone-200 bg-white/80 backdrop-blur-md flex items-center justify-between px-4 sm:px-6 shrink-0 relative z-30 select-none">
          <div className="flex items-center space-x-3">
            {/* Menu trigger (mobile only) */}
            <button 
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden text-stone-500 hover:text-stone-800 p-1.5 rounded-lg hover:bg-stone-100"
            >
              <Menu size={20} />
            </button>
            
            <div className="flex items-center space-x-2">
              <span className="hidden sm:inline px-2.5 py-1 bg-amber-500/10 text-amber-600 rounded-lg text-xs font-black">
                {dept}
              </span>
              <div className="flex items-center space-x-1.5">
                <span className={`w-2 h-2 rounded-full ${isClockedIn ? 'bg-emerald-500 animate-pulse' : 'bg-rose-400'}`} />
                <span className="text-xs font-bold text-stone-500">
                  {isClockedIn ? '值班中' : '未打卡上班'}
                </span>
              </div>
            </div>
          </div>

          {/* Right Toolbar Area */}
          <div className="flex items-center space-x-3">
            {/* Notifications Bell Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                className="relative p-2 rounded-xl text-stone-500 hover:bg-stone-50 hover:text-stone-800 transition-colors"
                title="通知中心"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 bg-rose-500 text-white text-[8px] font-bold w-4.5 h-4.5 min-w-[15px] min-h-[15px] flex items-center justify-center rounded-full">
                    {unreadCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {showNotifDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-stone-200 overflow-hidden z-50"
                  >
                    <div className="px-4 py-3 bg-stone-50 border-b border-stone-150 flex justify-between items-center">
                      <span className="font-bold text-stone-800 text-xs">通知中心</span>
                      <button
                        onClick={() => setShowNotifDropdown(false)}
                        className="p-1 rounded-lg hover:bg-stone-200 text-stone-400 hover:text-stone-600 transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="max-h-72 overflow-y-auto divide-y divide-stone-100">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-xs text-stone-400 font-medium">
                          目前沒有新通知
                        </div>
                      ) : (
                        notifications.slice(0, 5).map(n => (
                          <div
                            key={n.id}
                            onClick={() => {
                              if (!n.is_read) handleMarkAsRead(n.id);
                            }}
                            className={`px-4 py-3 hover:bg-stone-50 transition cursor-pointer text-left ${
                              !n.is_read ? 'bg-amber-50/20' : ''
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              {!n.is_read && (
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-stone-800 truncate">
                                  {n.title}
                                </p>
                                <p className="text-[11px] text-stone-500 mt-0.5 line-clamp-2">
                                  {n.message}
                                </p>
                                <p className="text-[9px] text-stone-400 mt-1">
                                  {new Date(n.created_at).toLocaleString('zh-TW')}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="px-4 py-2.5 bg-stone-50 border-t border-stone-100 text-center">
                      <button
                        onClick={() => {
                          setShowNotifDropdown(false);
                          navigate('/staff/notifications');
                        }}
                        className="text-[11px] font-bold text-stone-600 hover:text-stone-850"
                      >
                        查看所有通知 →
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Shift Clock-in Button */}
            <button
              onClick={handleClockInOut}
              disabled={clockLoading}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
                isClockedIn
                  ? 'bg-rose-50 text-rose-600 border border-rose-200/50 hover:bg-rose-100'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700'
              }`}
            >
              {clockLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Clock className="w-3.5 h-3.5" />
              )}
              <span>{isClockedIn ? '下班打卡' : '上班打卡'}</span>
            </button>
          </div>
        </header>

        {/* Subpages Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-stone-100">
          <Outlet />
        </div>
      </div>

      {/* Profile Edit Modal */}
      <AnimatePresence>
        {showProfileModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowProfileModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl border border-stone-100 overflow-hidden"
            >
              <h3 className="text-xl font-black text-stone-900 mb-2">修改個人資料</h3>
              <p className="text-stone-400 text-xs mb-6">更正您的系統姓名與身分顯示</p>
              
              <form onSubmit={handleUpdateProfile} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2 ml-1">
                    電子信箱
                  </label>
                  <input
                    type="email"
                    value={account?.email || ''}
                    disabled
                    className="w-full bg-stone-50 border border-stone-200 text-stone-400 rounded-xl px-4 py-3 text-sm focus:outline-none font-medium cursor-not-allowed select-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2 ml-1">
                    所屬部門
                  </label>
                  <input
                    type="text"
                    value={dept}
                    disabled
                    className="w-full bg-stone-50 border border-stone-200 text-stone-400 rounded-xl px-4 py-3 text-sm focus:outline-none font-medium cursor-not-allowed select-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2 ml-1">
                    真實姓名
                  </label>
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    placeholder="請輸入您的真實姓名"
                    className="w-full bg-white border border-stone-200 text-stone-900 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium shadow-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2 ml-1">
                    手機號碼
                  </label>
                  <input
                    type="tel"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    placeholder="請輸入您的手機號碼"
                    className="w-full bg-white border border-stone-200 text-stone-900 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium shadow-sm"
                    required
                  />
                </div>
                
                <div className="flex items-center gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowProfileModal(false)}
                    className="flex-1 py-3 border border-stone-200 text-stone-700 hover:bg-stone-50 font-bold rounded-xl transition-colors text-sm"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    disabled={profileLoading}
                    className="flex-1 bg-gradient-to-r from-amber-400 to-orange-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-orange-200/50 hover:-translate-y-0.5 disabled:opacity-75 disabled:cursor-not-allowed transition-all text-sm flex items-center justify-center gap-1.5"
                  >
                    {profileLoading ? <Loader2 size={16} className="animate-spin" /> : '確認修改'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

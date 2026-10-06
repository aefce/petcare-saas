import React, { useEffect, useState, useRef } from 'react';
import { 
  Calendar, 
  Clock, 
  ChevronRight, 
  Plus, 
  PawPrint, 
  Sparkles, 
  LogOut, 
  Camera, 
  Loader2, 
  Home, 
  User, 
  Bed, 
  Scissors, 
  Search, 
  Menu, 
  X, 
  Check, 
  AlertCircle,
  Bell
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import apiClient from '../api/client';
import { ServiceLogViewer } from '../components/ui/ServiceLogViewer';
import { AddPetModal } from '../components/ui/AddPetModal';
import { ProfileManagementModal } from '../components/ui/ProfileManagementModal';
import { VaccineHistoryModal } from '../components/ui/VaccineHistoryModal';
import { RefundRequestModal } from '../components/ui/RefundRequestModal';
import { HotelDailyLogViewerModal } from '../components/ui/HotelDailyLogViewerModal';

// --- Types ---
interface Pet {
  id: string;
  name: string;
  breed: string;
  weight_kg: number;
  avatar_url: string | null;
  is_vaccine_valid: boolean;
}

interface Booking {
  id: string;
  pet_name: string;
  service_name: string;
  start_time: string;
  status: string;
  refund_status?: string | null;
}

interface HotelBooking {
  id: string;
  pet_name: string;
  pet_species: string;
  room_type_name: string;
  check_in_date: string;
  check_out_date: string;
  status: string;
  total_fee: number;
  created_at: string;
}

// --- Status Badge Helper ---
const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    CONFIRMED: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    PENDING: 'bg-amber-50 text-amber-600 border-amber-100',
    ACTIVE: 'bg-blue-50 text-blue-600 border-blue-100',
    COMPLETED: 'bg-stone-100 text-stone-600 border-stone-200',
  };
  const labels: Record<string, string> = {
    CONFIRMED: '預約成功',
    PENDING: '待付款',
    ACTIVE: '服務中',
    COMPLETED: '已完成',
  };

  return (
    <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${styles[status] || 'bg-stone-100 text-stone-600'}`}>
      {labels[status] || status}
    </span>
  );
};

export default function Dashboard() {
  const { account, clearAuth } = useAuthStore();
  const userName = account?.name || account?.email?.split('@')[0] || 'Guest';
  const isMember = account?.is_member ?? true;

  const [pets, setPets] = useState<Pet[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [hotelBookings, setHotelBookings] = useState<HotelBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [uploadingPetId, setUploadingPetId] = useState<string | null>(null);

  // Active View Tab State
  const [activeTab, setActiveTab] = useState<'overview' | 'pets' | 'bookings' | 'hotel'>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Toast State for custom feedback (replacing alert())
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Search input state
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<{id: string, name: string} | null>(null);

  // New Modals State
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [addPetModalOpen, setAddPetModalOpen] = useState(false);
  const [vaccineModalOpen, setVaccineModalOpen] = useState(false);
  const [selectedPetForVaccine, setSelectedPetForVaccine] = useState<{ id: string, name: string } | null>(null);

  // Refund State
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [selectedBookingForRefund, setSelectedBookingForRefund] = useState<{id: string, name: string} | null>(null);

  // Hotel Log Viewer State
  const [hotelLogViewerTarget, setHotelLogViewerTarget] = useState<any>(null);
  const [hotelLogViewerOpen, setHotelLogViewerOpen] = useState(false);

  const handleOpenHotelLogViewer = (booking: any) => {
    setHotelLogViewerTarget(booking);
    setHotelLogViewerOpen(true);
  };

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async (showLoading = true) => {
    try {
      if (showLoading) setIsLoading(true);
      const [petsRes, bookingsRes, hotelRes] = await Promise.all([
        apiClient.get('/api/booking/pets'),
        apiClient.get('/api/booking/my-bookings'),
        apiClient.get('/api/hotel/my-bookings')
      ]);
      setPets(petsRes.data);
      setBookings(bookingsRes.data);
      setHotelBookings(hotelRes.data);
    } catch (error) {
      console.error("Failed to fetch dashboard data", error);
      showToast("載入資料失敗，請重新整理頁面", "error");
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await apiClient.post("/api/auth/logout");
    } catch (e) {
      console.error("Logout failed", e);
    } finally {
      clearAuth();
      window.location.href = "/login";
    }
  };

  const handleAddPet = () => {
    setAddPetModalOpen(true);
  };

  const handleCheckout = async (bookingId: string) => {
    try {
      setIsLoading(true);
      await apiClient.post('/api/payment/mock-callback', {
        booking_id: bookingId,
        payment_status: 'SUCCESS'
      });
      showToast('模擬付款成功！預約已確認。');
      fetchData(false);
    } catch (error) {
      console.error('Checkout failed', error);
      showToast('付款失敗，請稍後再試。', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleHotelCheckout = async (bookingId: string) => {
    try {
      setIsLoading(true);
      await apiClient.post('/api/payment/mock-callback', {
        booking_id: bookingId,
        payment_status: 'SUCCESS'
      });
      showToast('旅館模擬付款成功！預約已確認。');
      fetchData(false);
    } catch (error) {
      console.error('Hotel Checkout failed', error);
      showToast('付款失敗，請稍後再試。', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleHotelCancel = async (bookingId: string) => {
    if (!confirm('確認要取消此旅館預約並退款嗎？')) return;
    try {
      setIsLoading(true);
      await apiClient.post(`/api/hotel/bookings/${bookingId}/cancel`);
      showToast('旅館預約已成功取消/退款！');
      fetchData(false);
    } catch (error: any) {
      console.error('Hotel Cancel failed', error);
      showToast(error.response?.data?.detail || '取消失敗，請稍後再試。', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenRefundModal = (bookingId: string, petName: string) => {
    setSelectedBookingForRefund({ id: bookingId, name: petName });
    setRefundModalOpen(true);
  };

  const triggerAvatarUpload = (petId: string) => {
    setUploadingPetId(petId);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadingPetId) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setPets(prev => prev.map(p => p.id === uploadingPetId ? { ...p, avatar_url: 'loading' } : p));
      const res = await apiClient.post(`/api/booking/pets/${uploadingPetId}/avatar`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setPets(prev => prev.map(p => p.id === uploadingPetId ? { ...p, avatar_url: res.data.avatar_url } : p));
      showToast('寵物頭像上傳成功！');
    } catch (error) {
      console.error("Upload failed", error);
      showToast('頭像上傳失敗，請稍後再試', 'error');
      fetchData(false);
    } finally {
      setUploadingPetId(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const formatDateTime = (utcString: string) => {
    const dateObj = new Date(utcString + "Z");
    return {
      date: dateObj.toLocaleDateString('zh-TW', { month: '2-digit', day: '2-digit' }),
      time: dateObj.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false })
    };
  };

  const handleOpenLogModal = (bookingId: string, petName: string) => {
    setSelectedBooking({ id: bookingId, name: petName });
    setLogModalOpen(true);
  };

  const [selectedDate, setSelectedDate] = useState<string>('');

  const filteredBookings = selectedDate 
    ? bookings.filter(b => b.start_time.startsWith(selectedDate))
    : bookings;

  // Search filter implementation
  const displayPets = searchQuery 
    ? pets.filter(p => p.name.includes(searchQuery) || p.breed.includes(searchQuery))
    : pets;

  const displayBookings = searchQuery 
    ? filteredBookings.filter(b => b.pet_name.includes(searchQuery) || b.service_name.includes(searchQuery))
    : filteredBookings;

  const displayHotelBookings = searchQuery
    ? hotelBookings.filter(hb => hb.pet_name.includes(searchQuery) || hb.room_type_name.includes(searchQuery))
    : hotelBookings;

  // Get active counts
  const activeBookingsCount = bookings.filter(b => b.status === 'ACTIVE').length;
  const pendingPaymentsCount = bookings.filter(b => b.status === 'PENDING').length + hotelBookings.filter(hb => hb.status === 'PENDING').length;

  return (
    <div className="min-h-screen bg-stone-100 flex font-sans text-stone-900 selection:bg-amber-100 overflow-hidden relative">
      {/* Hidden file input for avatar upload */}
      <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleFileChange} />

      {/* Slide-in Toast Notifications */}
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

      {/* Desktop Sidebar (Stone-950/Stone-900 Dark Modern) */}
      <aside className="hidden lg:flex flex-col w-64 bg-stone-900 border-r border-stone-850 shrink-0 select-none">
        {/* Brand */}
        <div className="p-6 flex items-center space-x-3 border-b border-stone-800/60">
          <div className="bg-gradient-to-tr from-amber-400 to-orange-500 text-white p-2 rounded-xl shadow-md">
            <PawPrint size={20} className="transform -rotate-12" />
          </div>
          <span className="text-lg font-black text-white tracking-wide">毛星球 PetCare</span>
        </div>

        {/* Sidebar Nav Links */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          <button
            onClick={() => { setActiveTab('overview'); }}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'overview'
                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/10'
                : 'text-stone-400 hover:text-white hover:bg-stone-800/50'
            }`}
          >
            <Home size={18} />
            <span>總覽首頁</span>
          </button>

          <button
            onClick={() => { setActiveTab('pets'); }}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'pets'
                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/10'
                : 'text-stone-400 hover:text-white hover:bg-stone-800/50'
            }`}
          >
            <PawPrint size={18} />
            <span>我的毛孩</span>
          </button>

          <button
            onClick={() => { setActiveTab('bookings'); }}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'bookings'
                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/10'
                : 'text-stone-400 hover:text-white hover:bg-stone-800/50'
            }`}
          >
            <Scissors size={18} />
            <span>美容與照護</span>
          </button>

          <button
            onClick={() => { setActiveTab('hotel'); }}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'hotel'
                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/10'
                : 'text-stone-400 hover:text-white hover:bg-stone-800/50'
            }`}
          >
            <Bed size={18} />
            <span>旅館住宿</span>
          </button>
        </nav>

        {/* User Card at bottom */}
        <div className="p-4 border-t border-stone-800/60 bg-stone-950/30">
          <div className="flex items-center space-x-3 p-2 rounded-xl bg-stone-900 border border-stone-800/40">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-amber-400 to-orange-500 text-white flex items-center justify-center font-bold">
              {userName.substring(0, 1).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{userName}</p>
              <p className="text-xs font-semibold text-stone-500 truncate">
                {isMember ? '正式會員' : '臨時訪客'}
              </p>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="w-full mt-3 flex items-center justify-center space-x-2 py-2.5 rounded-xl border border-stone-800 text-stone-400 hover:text-red-400 hover:border-red-950/20 hover:bg-red-500/5 text-xs font-bold transition-all"
          >
            <LogOut size={14} />
            <span>安全登出</span>
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Slide-out Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden fixed inset-0 bg-black z-40"
            />
            {/* Menu Panel */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="lg:hidden fixed inset-y-0 left-0 w-72 bg-stone-900 border-r border-stone-800 z-50 flex flex-col justify-between"
            >
              <div>
                <div className="p-6 flex items-center justify-between border-b border-stone-800/60">
                  <div className="flex items-center space-x-3">
                    <div className="bg-gradient-to-tr from-amber-400 to-orange-500 text-white p-2 rounded-xl">
                      <PawPrint size={20} className="transform -rotate-12" />
                    </div>
                    <span className="text-lg font-black text-white">毛星球</span>
                  </div>
                  <button onClick={() => setMobileMenuOpen(false)} className="text-stone-400 hover:text-white">
                    <X size={20} />
                  </button>
                </div>

                <nav className="p-4 space-y-2">
                  <button
                    onClick={() => { setActiveTab('overview'); setMobileMenuOpen(false); }}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                      activeTab === 'overview' ? 'bg-amber-500 text-white' : 'text-stone-400 hover:text-white hover:bg-stone-800/50'
                    }`}
                  >
                    <Home size={18} />
                    <span>總覽首頁</span>
                  </button>
                  <button
                    onClick={() => { setActiveTab('pets'); setMobileMenuOpen(false); }}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                      activeTab === 'pets' ? 'bg-amber-500 text-white' : 'text-stone-400 hover:text-white hover:bg-stone-800/50'
                    }`}
                  >
                    <PawPrint size={18} />
                    <span>我的毛孩</span>
                  </button>
                  <button
                    onClick={() => { setActiveTab('bookings'); setMobileMenuOpen(false); }}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                      activeTab === 'bookings' ? 'bg-amber-500 text-white' : 'text-stone-400 hover:text-white hover:bg-stone-800/50'
                    }`}
                  >
                    <Scissors size={18} />
                    <span>美容與照護</span>
                  </button>
                  <button
                    onClick={() => { setActiveTab('hotel'); setMobileMenuOpen(false); }}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                      activeTab === 'hotel' ? 'bg-amber-500 text-white' : 'text-stone-400 hover:text-white hover:bg-stone-800/50'
                    }`}
                  >
                    <Bed size={18} />
                    <span>旅館住宿</span>
                  </button>
                </nav>
              </div>

              <div className="p-4 border-t border-stone-800/60 bg-stone-950/30">
                <div className="flex items-center space-x-3 p-2 rounded-xl bg-stone-900 border border-stone-800/40">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-amber-400 to-orange-500 text-white flex items-center justify-center font-bold">
                    {userName.substring(0, 1).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{userName}</p>
                    <p className="text-xs font-semibold text-stone-500 truncate">
                      {isMember ? '正式會員' : '臨時訪客'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full mt-3 flex items-center justify-center space-x-2 py-2.5 rounded-xl border border-stone-805 text-stone-400 hover:text-red-400 hover:bg-red-500/5 text-xs font-bold transition-all"
                >
                  <LogOut size={14} />
                  <span>安全登出</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar Layout */}
        <header className="h-16 border-b border-stone-200/80 bg-white/80 backdrop-blur-md flex items-center justify-between px-4 sm:px-6 shrink-0 relative z-30 select-none">
          <div className="flex items-center space-x-3">
            {/* Menu trigger (mobile only) */}
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden text-stone-500 hover:text-stone-800 p-1.5 rounded-lg hover:bg-stone-100"
            >
              <Menu size={20} />
            </button>
            <h2 className="text-md sm:text-lg font-black text-stone-900 tracking-tight">
              {activeTab === 'overview' && '總覽首頁'}
              {activeTab === 'pets' && '我的毛孩列表'}
              {activeTab === 'bookings' && '服務與照護預約'}
              {activeTab === 'hotel' && '旅館預約管理'}
            </h2>
          </div>

          {/* Center search (desktop only) */}
          <div className="hidden md:flex relative max-w-xs w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
            <input
              type="text"
              placeholder="搜尋毛孩、服務名稱..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-stone-800 placeholder:text-stone-400"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Right quick actions */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setProfileModalOpen(true)}
              className="p-1.5 text-stone-500 hover:text-stone-800 hover:bg-stone-50 rounded-xl transition-colors relative"
              title="帳號與通知設定"
            >
              <Bell size={20} />
              {pendingPaymentsCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-orange-500 ring-2 ring-white" />
              )}
            </button>

            {isMember ? (
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => window.location.href = '/hotel-booking'} 
                  className="hidden sm:flex items-center space-x-1.5 bg-stone-900 hover:bg-stone-800 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
                >
                  <Plus size={14} />
                  <span>預約旅館</span>
                </button>
                <button 
                  onClick={() => window.location.href = '/booking'} 
                  className="flex items-center space-x-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-md shadow-amber-500/5"
                >
                  <Plus size={14} />
                  <span>預約服務</span>
                </button>
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                <span className="text-[10px] sm:text-xs font-bold text-amber-800">訪客模式限制</span>
              </div>
            )}

            {/* Profile Avatar Trigger */}
            <div 
              onClick={() => setProfileModalOpen(true)}
              className="w-8 h-8 rounded-lg bg-stone-900 text-amber-400 flex items-center justify-center font-bold text-sm cursor-pointer shadow-sm ring-1 ring-stone-200/50 hover:bg-stone-800 transition-colors"
              title="修改帳號資料"
            >
              {userName.substring(0, 1).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Scrollable Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-stone-50 select-none">
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="max-w-6xl mx-auto space-y-8 pb-12"
          >
            {/* Time Aware Greeting Slogan Banner */}
            <div className="bg-gradient-to-r from-stone-900 to-stone-950 p-6 rounded-2xl relative overflow-hidden text-white shadow-xl">
              <div className="absolute right-0 top-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute left-1/3 bottom-0 w-64 h-64 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />
              
              <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold tracking-wider text-amber-400 uppercase">毛星球健康家長中心</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black text-stone-100 leading-tight">
                    早安，{userName} 👋
                  </h1>
                  <p className="text-stone-400 text-xs sm:text-sm font-medium">
                    我們隨時為您的寶貝提供頂級照護，今日有 {activeBookingsCount} 項進行中的服務。
                  </p>
                </div>
                {isMember && (
                  <div className="flex gap-2">
                    <button 
                      onClick={() => window.location.href = '/booking'} 
                      className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-amber-500/10"
                    >
                      快速安排美容
                    </button>
                    <button 
                      onClick={() => window.location.href = '/hotel-booking'} 
                      className="bg-white/10 hover:bg-white/15 border border-white/10 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all"
                    >
                      安排住宿
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Guest warning banner if guest */}
            {!isMember && (
              <div className="bg-amber-50 border border-amber-200/60 p-4 rounded-xl flex items-start space-x-3 shadow-sm">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-amber-900">臨時訪客體驗模式中</h4>
                  <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                    您的臨時訪客帳號將於 30 天後過期。此模式下您僅可追蹤現有寵物的狀態與日常照護日誌，<span className="font-bold text-rose-600">無法使用線上預約功能</span>。如需長期使用，歡迎攜帶證件至毛星球櫃檯升級為正式會員！
                  </p>
                </div>
              </div>
            )}

            {isLoading ? (
              <div className="flex flex-col justify-center items-center h-64 space-y-3">
                <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
                <span className="text-xs text-stone-500 font-medium">安全載入寵物資料與進度中...</span>
              </div>
            ) : (
              <>
                {/* Stats Cards / KPI Overview */}
                {activeTab === 'overview' && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="bg-white p-5 rounded-2xl border border-stone-200/60 shadow-sm flex items-center space-x-4">
                      <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                        <PawPrint size={24} />
                      </div>
                      <div>
                        <p className="text-stone-400 text-xs font-bold">登記毛小孩數量</p>
                        <h3 className="text-2xl font-black text-stone-900 mt-1">{pets.length} <span className="text-xs font-medium text-stone-500">隻</span></h3>
                      </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-stone-200/60 shadow-sm flex items-center space-x-4">
                      <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                        <Clock size={24} />
                      </div>
                      <div>
                        <p className="text-stone-400 text-xs font-bold">進行中託管照護</p>
                        <h3 className="text-2xl font-black text-stone-900 mt-1">{activeBookingsCount} <span className="text-xs font-medium text-stone-500">筆</span></h3>
                      </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-stone-200/60 shadow-sm flex items-center space-x-4">
                      <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                        <Calendar size={24} />
                      </div>
                      <div>
                        <p className="text-stone-400 text-xs font-bold">待付款/預訂預約</p>
                        <h3 className="text-2xl font-black text-stone-900 mt-1">{pendingPaymentsCount} <span className="text-xs font-medium text-stone-500">筆</span></h3>
                      </div>
                    </div>
                  </div>
                )}

                {/* --- Section 1: My Pets --- */}
                {(activeTab === 'overview' || activeTab === 'pets') && (
                  <section className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-stone-900 flex items-center space-x-2">
                        <span className="w-1 h-5 bg-amber-500 rounded-full" />
                        <span>我的毛小孩 ({displayPets.length})</span>
                      </h3>
                      <button
                        onClick={() => setProfileModalOpen(true)}
                        className="text-amber-600 hover:text-amber-700 font-bold text-xs flex items-center transition-colors"
                      >
                        <span>管理毛孩資料</span>
                        <ChevronRight size={14} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {displayPets.map((pet) => (
                        <motion.div
                          whileHover={{ y: -4 }}
                          key={pet.id}
                          className="bg-white border border-stone-200/60 p-5 rounded-2xl shadow-sm relative overflow-hidden group flex flex-col justify-between"
                        >
                          <div className="flex items-start gap-4">
                            {/* Avatar with click to upload */}
                            <div
                              onClick={() => triggerAvatarUpload(pet.id)}
                              className="relative w-16 h-16 rounded-xl overflow-hidden cursor-pointer shadow-sm border border-stone-200 shrink-0 group/avatar bg-stone-50"
                              title="點擊更換頭像"
                            >
                              {pet.avatar_url === 'loading' ? (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Loader2 className="w-5 h-5 text-amber-500 animate-spin" />
                                </div>
                              ) : pet.avatar_url ? (
                                <img src={pet.avatar_url} alt={pet.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-amber-500">
                                  <PawPrint size={28} />
                                </div>
                              )}
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity">
                                <Camera className="w-4 h-4 text-white" />
                              </div>
                            </div>

                            {/* Details */}
                            <div className="min-w-0 flex-1">
                              <h4 className="font-bold text-stone-900 truncate flex items-center gap-1.5 flex-wrap">
                                {pet.name}
                              </h4>
                              <p className="text-stone-500 text-xs mt-1 truncate">
                                品種：{pet.breed || '未知品種'}
                              </p>
                              <p className="text-stone-500 text-xs mt-0.5">
                                體重：{pet.weight_kg ? `${pet.weight_kg} kg` : '未登錄'}
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
                            <span 
                              onClick={() => {
                                setSelectedPetForVaccine({ id: pet.id, name: pet.name });
                                setVaccineModalOpen(true);
                              }}
                              className={`text-[10px] px-2 py-1 rounded-lg font-bold cursor-pointer transition border hover:scale-[1.03] ${
                                pet.is_vaccine_valid 
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200/50' 
                                  : 'bg-rose-50 text-rose-700 border-rose-200/50'
                              }`}
                              title="點選管理疫苗證明"
                            >
                              {pet.is_vaccine_valid ? '💉 疫苗合規' : '⚠️ 疫苗未更新'}
                            </span>
                            
                            <button
                              onClick={() => {
                                setSelectedPetForVaccine({ id: pet.id, name: pet.name });
                                setVaccineModalOpen(true);
                              }}
                              className="text-[11px] font-bold text-stone-500 hover:text-amber-600 transition-colors"
                            >
                              管理疫苗檔案
                            </button>
                          </div>
                        </motion.div>
                      ))}

                      {/* Add Pet Card */}
                      <motion.div
                        onClick={handleAddPet}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        className="bg-stone-100/70 border-2 border-dashed border-stone-200/80 p-5 rounded-2xl flex flex-col items-center justify-center text-stone-400 hover:text-stone-600 hover:bg-stone-100 hover:border-stone-300 transition-all cursor-pointer min-h-[140px]"
                      >
                        <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center border border-stone-250 mb-2">
                          <Plus size={18} />
                        </div>
                        <span className="text-xs font-bold">登記新增毛小孩</span>
                      </motion.div>
                    </div>
                  </section>
                )}

                {/* --- Section 2: Services Bookings --- */}
                {(activeTab === 'overview' || activeTab === 'bookings') && (
                  <section className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <h3 className="text-lg font-bold text-stone-900 flex items-center space-x-2">
                        <span className="w-1 h-5 bg-amber-500 rounded-full" />
                        <span>美容與美容照護預約 ({displayBookings.length})</span>
                      </h3>
                      
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-semibold text-stone-400">日期過濾</span>
                        <input
                          type="date"
                          value={selectedDate}
                          onChange={(e) => setSelectedDate(e.target.value)}
                          className="bg-white border border-stone-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                        />
                        {selectedDate && (
                          <button
                            onClick={() => setSelectedDate('')}
                            className="bg-stone-200 hover:bg-stone-300 text-stone-700 text-xs font-bold px-2 py-1.5 rounded-lg"
                          >
                            清除
                          </button>
                        )}
                      </div>
                    </div>

                    {displayBookings.length === 0 ? (
                      <div className="bg-white/60 border border-stone-200/60 p-10 rounded-2xl text-center">
                        <p className="text-stone-500 text-sm">此分類下目前沒有預約記錄</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {displayBookings.map((booking) => {
                          const { date, time } = formatDateTime(booking.start_time);
                          return (
                            <div
                              key={booking.id}
                              className="bg-white border border-stone-200/60 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm hover:shadow-md transition-all"
                            >
                              <div className="flex items-start gap-4">
                                <div className="p-3 bg-amber-50 text-amber-600 rounded-xl shrink-0">
                                  <Scissors size={20} />
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center space-x-2.5 flex-wrap">
                                    <h4 className="font-bold text-stone-900 text-sm">{booking.service_name}</h4>
                                    {booking.refund_status === 'PENDING_APPROVAL' ? (
                                      <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-amber-50 text-amber-700 border border-amber-200/50">
                                        ⚠️ 退款審核中
                                      </span>
                                    ) : (
                                      <StatusBadge status={booking.status} />
                                    )}
                                  </div>
                                  <div className="flex items-center space-x-4 text-xs font-semibold text-stone-500 mt-2 flex-wrap">
                                    <span className="flex items-center space-x-1">
                                      <PawPrint size={13} />
                                      <span>{booking.pet_name}</span>
                                    </span>
                                    <span>•</span>
                                    <span className="flex items-center space-x-1">
                                      <Calendar size={13} />
                                      <span>{date}</span>
                                    </span>
                                    <span>•</span>
                                    <span className="flex items-center space-x-1">
                                      <Clock size={13} />
                                      <span>{time}</span>
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Button Actions */}
                              <div className="flex items-center space-x-2 shrink-0 self-end md:self-center">
                                {booking.status === 'PENDING' ? (
                                  <button
                                    onClick={() => handleCheckout(booking.id)}
                                    className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs px-4 py-2 rounded-lg shadow-sm transition-all"
                                  >
                                    線上付款
                                  </button>
                                ) : booking.status === 'CONFIRMED' ? (
                                  <>
                                    {booking.refund_status !== 'PENDING_APPROVAL' && (
                                      <button
                                        onClick={() => handleOpenRefundModal(booking.id, booking.pet_name)}
                                        className="bg-rose-50 text-rose-600 border border-rose-200/60 hover:bg-rose-100 font-bold text-xs px-3 py-2 rounded-lg transition-all"
                                      >
                                        申請退費
                                      </button>
                                    )}
                                    <button className="bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs px-3 py-2 rounded-lg transition-all border border-stone-200">
                                      細節
                                    </button>
                                  </>
                                ) : booking.status === 'ACTIVE' || booking.status === 'COMPLETED' ? (
                                  <button
                                    onClick={() => handleOpenLogModal(booking.id, booking.pet_name)}
                                    className="bg-amber-50 text-amber-700 border border-amber-200/40 hover:bg-amber-100 font-bold text-xs px-3.5 py-2 rounded-lg transition-all"
                                  >
                                    查看照護日誌
                                  </button>
                                ) : (
                                  <span className="text-xs font-bold text-stone-400 px-3 py-2 bg-stone-100 rounded-lg border border-stone-200/60">
                                    {booking.status === 'CANCELLED' && '已取消'}
                                    {booking.status === 'REFUNDED' && '已退款'}
                                    {booking.status === 'EXPIRED' && '已過期'}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </section>
                )}

                {/* --- Section 3: Hotel Bookings --- */}
                {(activeTab === 'overview' || activeTab === 'hotel') && (
                  <section className="space-y-4">
                    <h3 className="text-lg font-bold text-stone-900 flex items-center space-x-2">
                      <span className="w-1 h-5 bg-amber-500 rounded-full" />
                      <span>🏨 寵物旅館預約明細 ({displayHotelBookings.length})</span>
                    </h3>

                    {displayHotelBookings.length === 0 ? (
                      <div className="bg-white/60 border border-stone-200/60 p-10 rounded-2xl text-center">
                        <p className="text-stone-500 text-sm">目前沒有任何旅館預訂記錄</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {displayHotelBookings.map((hb) => (
                          <div
                            key={hb.id}
                            className="bg-white border border-stone-200/60 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm hover:shadow-md transition-all"
                          >
                            <div className="flex items-start gap-4">
                              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl shrink-0">
                                <Bed size={20} />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center space-x-2.5">
                                  <h4 className="font-bold text-stone-900 text-sm">{hb.room_type_name}</h4>
                                  <StatusBadge status={hb.status} />
                                </div>
                                <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-stone-500 mt-2">
                                  <span className="flex items-center space-x-1">
                                    <PawPrint size={13} />
                                    <span>{hb.pet_name}</span>
                                  </span>
                                  <span>•</span>
                                  <span>入住: {hb.check_in_date}</span>
                                  <span>•</span>
                                  <span>退房: {hb.check_out_date}</span>
                                  <span>•</span>
                                  <span className="text-amber-600 font-bold">
                                    總價 NT$ {hb.total_fee}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Hotel Actions */}
                            <div className="flex items-center space-x-2 shrink-0 self-end md:self-center">
                              {hb.status === 'PENDING' ? (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleHotelCheckout(hb.id)}
                                    className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs px-4 py-2 rounded-lg shadow-sm transition-all"
                                  >
                                    付款確認
                                  </button>
                                  <button
                                    onClick={() => handleHotelCancel(hb.id)}
                                    className="bg-stone-100 hover:bg-stone-200 text-stone-600 font-bold text-xs px-3 py-2 rounded-lg transition-all border border-stone-200"
                                  >
                                    取消
                                  </button>
                                </div>
                              ) : hb.status === 'CONFIRMED' ? (
                                <button
                                  onClick={() => handleOpenRefundModal(hb.id, hb.pet_name)}
                                  className="bg-rose-50 text-rose-600 border border-rose-200/60 hover:bg-rose-100 font-bold text-xs px-3.5 py-2 rounded-lg transition-all"
                                >
                                  取消退款
                                </button>
                              ) : hb.status === 'ACTIVE' || hb.status === 'COMPLETED' ? (
                                <div className="flex items-center space-x-2">
                                  {hb.status === 'ACTIVE' && (
                                    <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-1 rounded-md border border-blue-200/30">
                                      住宿中
                                    </span>
                                  )}
                                  <button
                                    onClick={() => handleOpenHotelLogViewer(hb)}
                                    className="bg-amber-50 text-amber-700 border border-amber-200/40 hover:bg-amber-100 font-bold text-xs px-3.5 py-2 rounded-lg transition-all whitespace-nowrap"
                                  >
                                    查看每日照護日誌
                                  </button>
                                </div>
                              ) : (
                                <span className="text-xs font-bold text-stone-400 px-3 py-2 bg-stone-100 rounded-lg border border-stone-200/60">
                                  {hb.status === 'CANCELLED' && '已取消'}
                                  {hb.status === 'REFUNDED' && '已退款'}
                                  {hb.status === 'EXPIRED' && '已失效'}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                )}
              </>
            )}
          </motion.div>
        </div>
      </div>

      {/* --- Modal Integrations (Preserved) --- */}
      {selectedBooking && (
        <ServiceLogViewer
          isOpen={logModalOpen}
          onClose={() => setLogModalOpen(false)}
          bookingId={selectedBooking.id}
          petName={selectedBooking.name}
        />
      )}

      <ProfileManagementModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        pets={pets}
        onRefreshPets={() => fetchData(false)}
        onOpenVaccineHistory={(id, name) => {
          setSelectedPetForVaccine({ id, name });
          setVaccineModalOpen(true);
        }}
      />

      <AddPetModal
        isOpen={addPetModalOpen}
        onClose={() => setAddPetModalOpen(false)}
        onSuccess={() => {
          showToast('成功新增毛小孩檔案！');
          fetchData(false);
        }}
      />

      {selectedPetForVaccine && (
        <VaccineHistoryModal
          isOpen={vaccineModalOpen}
          onClose={() => {
            setVaccineModalOpen(false);
            setSelectedPetForVaccine(null);
          }}
          petId={selectedPetForVaccine.id}
          petName={selectedPetForVaccine.name}
          onSuccess={() => {
            showToast('疫苗紀錄更新成功！');
            fetchData(false);
          }}
        />
      )}

      {selectedBookingForRefund && (
        <RefundRequestModal
          isOpen={refundModalOpen}
          onClose={() => {
            setRefundModalOpen(false);
            setSelectedBookingForRefund(null);
          }}
          bookingId={selectedBookingForRefund.id}
          petName={selectedBookingForRefund.name}
          onSuccess={() => {
            showToast('退款申請已成功提交！');
            fetchData(false);
          }}
        />
      )}

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

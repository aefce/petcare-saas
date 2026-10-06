import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Home, UserCheck, ShieldAlert } from 'lucide-react';
import apiClient from '../../api/client';

interface HotelCheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  petName: string;
  roomTypeId: string;
  roomTypeName: string;
  onSuccess: () => void;
}

export function HotelCheckInModal({
  isOpen,
  onClose,
  bookingId,
  petName,
  roomTypeId,
  roomTypeName,
  onSuccess
}: HotelCheckInModalProps) {
  const [rooms, setRooms] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [loadingData, setLoadingData] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && bookingId) {
      fetchData();
    }
  }, [isOpen, bookingId]);

  const fetchData = async () => {
    setLoadingData(true);
    setError('');
    try {
      // 1. 取得該房型的實體房間
      const roomsRes = await apiClient.get(`/api/hotel/rooms/${roomTypeId}/physical`);
      // 過濾可用/清潔中房間
      const availableRooms = roomsRes.data.filter(
        (r: any) => r.status === 'AVAILABLE' || r.status === 'CLEANING'
      );
      setRooms(availableRooms);
      if (availableRooms.length > 0) {
        setSelectedRoomId(availableRooms[0].id);
      }

      // 2. 取得全體員工列表
      const staffRes = await apiClient.get('/api/auth/staff');
      setStaffList(staffRes.data);
    } catch (err: any) {
      console.error(err);
      setError('載入房間或員工資料失敗，請重試。');
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      await apiClient.post(`/api/hotel/bookings/${bookingId}/check-in`, {
        room_id: selectedRoomId || null,
        staff_id: selectedStaffId || null
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || '辦理入住失敗，請確認寵物疫苗是否合規。');
    } finally {
      setIsSubmitting(false);
    }
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
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-3xl p-6 z-50 shadow-2xl overflow-y-auto max-h-[90vh] font-sans"
          >
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-stone-800">辦理入住 Check-In</h2>
                <p className="text-sm text-stone-500 mt-1">寵物：{petName} ({roomTypeName})</p>
              </div>
              <button onClick={onClose} className="p-2 text-stone-400 hover:text-stone-600 rounded-full hover:bg-stone-100 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-rose-50 text-rose-600 rounded-xl text-sm font-medium flex items-start gap-2 border border-rose-100">
                <ShieldAlert className="w-5 h-5 shrink-0 text-rose-500" />
                <span>{error}</span>
              </div>
            )}

            {loadingData ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-stone-500">
                <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                <span className="text-sm">正取得可用房號與員工清單...</span>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* 選擇房號 */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-stone-700 flex items-center gap-1.5">
                    <Home className="w-4 h-4 text-stone-400" />
                    指派實體房號 <span className="text-rose-500">*</span>
                  </label>
                  {rooms.length === 0 ? (
                    <div className="p-3 bg-amber-50 text-amber-700 rounded-xl text-xs font-semibold border border-amber-100">
                      ⚠️ 當前無空閒房間可指派，入住將採用後台自動配置。
                    </div>
                  ) : (
                    <select
                      value={selectedRoomId}
                      onChange={(e) => setSelectedRoomId(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:bg-white transition-all text-stone-800 text-sm font-medium"
                      required
                    >
                      {rooms.map((room) => (
                        <option key={room.id} value={room.id}>
                          {room.room_number} ({room.status === 'CLEANING' ? '清潔中' : '空閒可用'})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* 選擇照護員 */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-stone-700 flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-stone-400" />
                    指派負責照護員 (選填)
                  </label>
                  <select
                    value={selectedStaffId}
                    onChange={(e) => setSelectedStaffId(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:bg-white transition-all text-stone-800 text-sm font-medium"
                  >
                    <option value="">-- 暫不指派 (後續可手動修改) --</option>
                    {staffList
                      .filter((s: any) => s.is_active)
                      .map((staff) => (
                        <option key={staff.id} value={staff.id}>
                          {staff.full_name} ({staff.department || '無部門'})
                        </option>
                      ))}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-orange-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 hover:bg-orange-600 transition active:scale-95 disabled:opacity-70 disabled:pointer-events-none"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    '確認辦理入住 (Confirm Check-In)'
                  )}
                </button>
              </form>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

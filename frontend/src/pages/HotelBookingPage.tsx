import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CheckCircle2, PawPrint, Sparkles, Loader2, Calendar as CalendarIcon, Hotel, DollarSign, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import { GlassCard } from '../components/ui/GlassCard';

interface Pet {
  id: string;
  name: string;
  breed: string;
  avatar_url: string | null;
  is_vaccine_valid: boolean;
}

interface RoomType {
  id: string;
  name: string;
  description: string;
  price_per_night: number;
  total_rooms: number;
  is_active: boolean;
  available?: boolean;
}

export default function HotelBookingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Data
  const [pets, setPets] = useState<Pet[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  // Selection
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);
  const [checkInDate, setCheckInDate] = useState<string>('');
  const [checkOutDate, setCheckOutDate] = useState<string>('');
  const [selectedRoomTypeId, setSelectedRoomTypeId] = useState<string | null>(null);

  // Initialize dates: check-in = tomorrow, check-out = day after tomorrow
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 2);

    setCheckInDate(tomorrow.toISOString().split('T')[0]);
    setCheckOutDate(dayAfter.toISOString().split('T')[0]);
    fetchPets();
  }, []);

  const fetchPets = async () => {
    try {
      setIsLoading(true);
      const res = await apiClient.get('/api/booking/pets');
      setPets(res.data);
      if (res.data.length === 1 && res.data[0].is_vaccine_valid) {
        setSelectedPetId(res.data[0].id);
      }
    } catch (error) {
      console.error("Failed to fetch pets", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRoomTypesAndCheckAvailability = async () => {
    try {
      setCheckingAvailability(true);
      // 1. Fetch Room Types
      const roomsRes = await apiClient.get('/api/hotel/rooms');
      const activeRooms = roomsRes.data.filter((r: RoomType) => r.is_active);

      // 2. Query Availability for each room type
      const verifiedRooms = await Promise.all(
        activeRooms.map(async (room: RoomType) => {
          try {
            const availRes = await apiClient.get('/api/hotel/rooms/availability', {
              params: {
                room_type_id: room.id,
                check_in: checkInDate,
                check_out: checkOutDate
              }
            });
            return { ...room, available: availRes.data.available };
          } catch {
            return { ...room, available: false };
          }
        })
      );

      setRoomTypes(verifiedRooms);
    } catch (error) {
      console.error("Failed to query room types or availability", error);
    } finally {
      setCheckingAvailability(false);
    }
  };

  useEffect(() => {
    if (step === 3 && checkInDate && checkOutDate) {
      fetchRoomTypesAndCheckAvailability();
    }
  }, [step, checkInDate, checkOutDate]);

  const selectedPet = pets.find(p => p.id === selectedPetId);
  const selectedRoomType = roomTypes.find(r => r.id === selectedRoomTypeId);
  
  // Calculate total nights
  const nights = checkInDate && checkOutDate 
    ? Math.max(1, Math.round((new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) / (1000 * 60 * 60 * 24)))
    : 1;

  const totalFee = selectedRoomType ? selectedRoomType.price_per_night * nights : 0;

  const handleConfirmBooking = async () => {
    if (!selectedPetId || !selectedRoomTypeId || !checkInDate || !checkOutDate) return;

    try {
      setIsSubmitting(true);
      // 1. Create Pending Room Booking
      const reserveRes = await apiClient.post('/api/hotel/reserve', {
        pet_id: selectedPetId,
        room_type_id: selectedRoomTypeId,
        check_in_date: checkInDate,
        check_out_date: checkOutDate
      });
      const bookingId = reserveRes.data.id;

      // 2. Mock payment confirmation callback
      await apiClient.post('/api/payment/mock-callback', {
        booking_id: bookingId,
        payment_status: 'SUCCESS'
      });

      alert('預訂成功！已為您的毛寶貝完成寵物旅館預約與付款。');
      navigate('/dashboard');
    } catch (error: any) {
      console.error("Hotel booking failed", error);
      alert(error.response?.data?.detail || "預訂失敗，請稍後再試！");
    } finally {
      setIsSubmitting(false);
    }
  };

  const tomorrowStr = new Date();
  tomorrowStr.setDate(tomorrowStr.getDate() + 1);
  const minCheckIn = tomorrowStr.toISOString().split('T')[0];

  const minCheckOut = checkInDate 
    ? (() => {
        const d = new Date(checkInDate);
        d.setDate(d.getDate() + 1);
        return d.toISOString().split('T')[0];
      })()
    : minCheckIn;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-orange-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 p-6 md:p-12 font-sans selection:bg-orange-200">
      <div className="max-w-3xl mx-auto">
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-stone-500 hover:text-stone-800 transition-colors mb-8 font-medium">
          <ArrowLeft className="w-5 h-5" /> 返回主控台
        </button>

        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-orange-100 text-orange-500 rounded-2xl flex items-center justify-center">
            <Hotel className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-stone-800">預約寵物旅館 🏨</h1>
            <p className="text-sm text-stone-500 mt-1">為毛孩安排一個像家一樣舒適的假期</p>
          </div>
        </div>

        <GlassCard className="!p-0 overflow-hidden">
          {/* Stepper */}
          <div className="flex border-b border-stone-100 bg-white/40">
            {['選擇毛孩', '選擇日期', '選擇房型', '確認結帳'].map((label, idx) => (
              <div 
                key={label}
                className={`flex-1 py-4 text-center font-semibold text-xs md:text-sm transition-colors ${step >= idx + 1 ? 'text-orange-600 bg-orange-50/50' : 'text-stone-400'}`}
              >
                {idx + 1}. {label}
              </div>
            ))}
          </div>

          <div className="p-8 space-y-8">
            <AnimatePresence mode="wait">
              {/* Step 1: Select Pet */}
              {step === 1 && (
                <motion.div 
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <h2 className="text-xl font-bold text-stone-800">請問哪位毛寶貝要入住呢？</h2>
                  {pets.length === 0 ? (
                    <div className="text-center py-6 text-stone-500">
                      您還沒有建立寵物檔案，請先回主控台新增。
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {pets.map(pet => (
                        <div 
                          key={pet.id} 
                          onClick={() => pet.is_vaccine_valid && setSelectedPetId(pet.id)}
                          className={`p-4 rounded-2xl border-2 transition-all flex items-center gap-4 ${!pet.is_vaccine_valid ? 'border-red-100 bg-red-50/30 opacity-70 cursor-not-allowed' : selectedPetId === pet.id ? 'border-orange-500 bg-orange-50 cursor-pointer' : 'border-stone-100 hover:border-stone-200 cursor-pointer'}`}
                        >
                          <div className="w-12 h-12 rounded-full overflow-hidden bg-stone-200">
                            {pet.avatar_url ? <img src={pet.avatar_url} className="w-full h-full object-cover" /> : <PawPrint className="w-6 h-6 m-3 text-stone-400" />}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 justify-between">
                              <h3 className="font-bold text-stone-800">{pet.name}</h3>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${pet.is_vaccine_valid ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                                {pet.is_vaccine_valid ? '💉 疫苗合規' : '⚠️ 疫苗未合規'}
                              </span>
                            </div>
                            <p className="text-xs text-stone-500 mt-1">{pet.breed || '混種'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {!selectedPet?.is_vaccine_valid && selectedPetId && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-red-700 text-sm">
                      <Info className="w-5 h-5 shrink-0 mt-0.5" />
                      <p>
                        <strong>提示：</strong> 您選擇的寵物疫苗狀態未合規。根據本館規定，入住寵物必須具備未過期的疫苗證明 (狗: 狂犬病+五合一；貓: 三合一)。請先至主控台「管理檔案」上傳憑證供管理員審核。
                      </p>
                    </div>
                  )}

                  <div className="flex justify-end pt-4">
                    <button 
                      disabled={!selectedPetId || !selectedPet?.is_vaccine_valid}
                      onClick={() => setStep(2)}
                      className="bg-stone-800 text-white px-6 py-3 rounded-xl font-medium disabled:opacity-50 transition-all hover:bg-stone-700 active:scale-95"
                    >
                      下一步
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Select Date Range */}
              {step === 2 && (
                <motion.div 
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <h2 className="text-xl font-bold text-stone-800">請選擇入住與退房日期</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white/50 p-6 rounded-2xl border border-stone-100">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-stone-600 flex items-center gap-1.5">
                        <CalendarIcon className="w-4 h-4 text-orange-500" /> 入住日期
                      </label>
                      <input 
                        type="date"
                        min={minCheckIn}
                        value={checkInDate}
                        onChange={(e) => {
                          setCheckInDate(e.target.value);
                          // Adjust check-out if check-in is after or equal check-out
                          if (e.target.value >= checkOutDate) {
                            const newOut = new Date(e.target.value);
                            newOut.setDate(newOut.getDate() + 1);
                            setCheckOutDate(newOut.toISOString().split('T')[0]);
                          }
                        }}
                        className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium text-stone-700"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-stone-600 flex items-center gap-1.5">
                        <CalendarIcon className="w-4 h-4 text-orange-500" /> 退房日期
                      </label>
                      <input 
                        type="date"
                        min={minCheckOut}
                        value={checkOutDate}
                        onChange={(e) => setCheckOutDate(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium text-stone-700"
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-orange-50/50 border border-orange-100 rounded-2xl flex items-center gap-3 text-orange-800 text-sm">
                    <Info className="w-5 h-5 shrink-0" />
                    <span>這次住宿總共是 <strong>{nights}</strong> 晚</span>
                  </div>

                  <div className="flex justify-between pt-4">
                    <button onClick={() => setStep(1)} className="text-stone-500 font-medium hover:text-stone-800">上一步</button>
                    <button 
                      disabled={!checkInDate || !checkOutDate}
                      onClick={() => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const checkIn = new Date(checkInDate);
                        const checkOut = new Date(checkOutDate);

                        if (checkIn < today) {
                          alert("入住日期不能是過去的日期！");
                          return;
                        }
                        if (checkOut <= checkIn) {
                          alert("退房日期必須大於入住日期！");
                          return;
                        }
                        setStep(3);
                      }}
                      className="bg-stone-800 text-white px-6 py-3 rounded-xl font-medium disabled:opacity-50 transition-all hover:bg-stone-700 active:scale-95"
                    >
                      下一步
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Select Room Type */}
              {step === 3 && (
                <motion.div 
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-stone-800">請選擇房型 (已過濾空房)</h2>
                    <span className="text-xs text-stone-400">入住時間: {checkInDate} ~ {checkOutDate}</span>
                  </div>

                  {checkingAvailability ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-3">
                      <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
                      <span className="text-sm text-stone-500 font-medium">正在為您查詢可用空房...</span>
                    </div>
                  ) : roomTypes.length === 0 ? (
                    <p className="text-stone-500 py-6 text-center">目前沒有開放的房型。</p>
                  ) : (
                    <div className="space-y-3">
                      {roomTypes.map(room => (
                        <div 
                          key={room.id}
                          onClick={() => room.available && setSelectedRoomTypeId(room.id)}
                          className={`p-5 rounded-2xl border-2 transition-all flex justify-between items-start md:items-center flex-col md:flex-row gap-4 ${!room.available ? 'border-stone-100 bg-stone-100/40 opacity-60 cursor-not-allowed' : selectedRoomTypeId === room.id ? 'border-orange-500 bg-orange-50 cursor-pointer' : 'border-stone-100 hover:border-stone-200 cursor-pointer'}`}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-stone-800">{room.name}</h3>
                              {room.available ? (
                                <span className="bg-emerald-50 text-emerald-600 border border-emerald-200/50 text-[10px] px-2 py-0.5 rounded-full font-bold">● 有空房</span>
                              ) : (
                                <span className="bg-stone-100 text-stone-500 border border-stone-200 text-[10px] px-2 py-0.5 rounded-full font-bold">● 已售罄</span>
                              )}
                            </div>
                            <p className="text-sm text-stone-500">{room.description}</p>
                          </div>
                          
                          <div className="flex items-baseline gap-1 self-end md:self-auto">
                            <span className="text-xs text-stone-400 font-medium">每晚</span>
                            <span className="font-bold text-orange-600 text-xl">NT$ {room.price_per_night}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-between pt-4">
                    <button onClick={() => setStep(2)} className="text-stone-500 font-medium hover:text-stone-800">上一步</button>
                    <button 
                      disabled={!selectedRoomTypeId || checkingAvailability}
                      onClick={() => setStep(4)}
                      className="bg-stone-800 text-white px-6 py-3 rounded-xl font-medium disabled:opacity-50 transition-all hover:bg-stone-700 active:scale-95"
                    >
                      下一步
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Step 4: Review and Checkout */}
              {step === 4 && (
                <motion.div 
                  key="step4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <h2 className="text-xl font-bold text-stone-800">確認您的預約明細</h2>
                  
                  <div className="bg-white/50 border border-stone-100 rounded-3xl p-6 space-y-6">
                    <div className="flex items-center justify-between border-b border-stone-100 pb-4">
                      <span className="text-stone-500 font-medium">入住毛孩</span>
                      <span className="font-bold text-stone-800 flex items-center gap-1.5"><PawPrint className="w-4 h-4 text-orange-500" /> {selectedPet?.name}</span>
                    </div>

                    <div className="flex items-center justify-between border-b border-stone-100 pb-4">
                      <span className="text-stone-500 font-medium">入住日期</span>
                      <span className="font-bold text-stone-800 flex items-center gap-1.5"><CalendarIcon className="w-4 h-4 text-orange-500" /> {checkInDate}</span>
                    </div>

                    <div className="flex items-center justify-between border-b border-stone-100 pb-4">
                      <span className="text-stone-500 font-medium">退房日期</span>
                      <span className="font-bold text-stone-800 flex items-center gap-1.5"><CalendarIcon className="w-4 h-4 text-orange-500" /> {checkOutDate}</span>
                    </div>

                    <div className="flex items-center justify-between border-b border-stone-100 pb-4">
                      <span className="text-stone-500 font-medium">預約房型</span>
                      <span className="font-bold text-stone-800 flex items-center gap-1.5"><Hotel className="w-4 h-4 text-orange-500" /> {selectedRoomType?.name}</span>
                    </div>

                    <div className="flex items-center justify-between border-b border-stone-100 pb-4">
                      <span className="text-stone-500 font-medium">住宿晚數</span>
                      <span className="font-bold text-stone-800">{nights} 晚</span>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <span className="text-stone-800 font-bold text-lg">總計費用</span>
                      <span className="font-extrabold text-orange-600 text-2xl flex items-center"><DollarSign className="w-6 h-6 shrink-0" /> NT$ {totalFee}</span>
                    </div>
                  </div>

                  <div className="flex justify-between pt-4">
                    <button onClick={() => setStep(3)} className="text-stone-500 font-medium hover:text-stone-800">上一步</button>
                    <button 
                      disabled={isSubmitting}
                      onClick={handleConfirmBooking}
                      className="bg-gradient-to-r from-orange-500 to-orange-400 text-white px-8 py-3.5 rounded-xl font-bold shadow-md shadow-orange-500/20 disabled:opacity-50 flex items-center gap-2 hover:from-orange-600 hover:to-orange-500 transition-all duration-300 active:scale-95"
                    >
                      {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle2 className="w-5 h-5" /> 確認預約並線上付款</>}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

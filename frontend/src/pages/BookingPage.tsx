import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CheckCircle2, PawPrint, Sparkles, Loader2, Calendar as CalendarIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import { GlassCard } from '../components/ui/GlassCard';

export default function BookingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Data
  const [pets, setPets] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [timeslots, setTimeslots] = useState<any[]>([]);

  // Selection
  const [selectedPet, setSelectedPet] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [petsRes, servicesRes, slotsRes] = await Promise.all([
        apiClient.get('/api/booking/pets'),
        apiClient.get('/api/booking/services'),
        apiClient.get('/api/booking/timeslots')
      ]);
      setPets(petsRes.data);
      setServices(servicesRes.data);
      setTimeslots(slotsRes.data);
      
      // Auto-select if only one
      if (petsRes.data.length === 1) setSelectedPet(petsRes.data[0].id);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!selectedPet || !selectedService || !selectedSlot) return;
    
    try {
      setIsSubmitting(true);
      // 1. Create PENDING booking
      const reserveRes = await apiClient.post('/api/booking/reserve', {
        pet_id: selectedPet,
        service_item_id: selectedService,
        time_slot_id: selectedSlot
      });
      const bookingId = reserveRes.data.id;

      // 2. Mock Payment to CONFIRM
      await apiClient.post('/api/payment/mock-callback', {
        booking_id: bookingId,
        payment_method: 'CREDIT_CARD'
      });

      // 3. Success -> Back to dashboard
      navigate('/dashboard');
    } catch (error: any) {
      console.error("Booking failed", error);
      alert(error.response?.data?.detail || "預約失敗，請稍後再試！");
    } finally {
      setIsSubmitting(false);
    }

  };

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
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-bold text-stone-800">為寶貝安排新服務</h1>
        </div>

        <GlassCard className="!p-0 overflow-hidden">
          {/* Stepper Progress */}
          <div className="flex border-b border-stone-100 bg-white/40">
            {['選擇毛孩', '選擇服務', '選擇時段'].map((label, idx) => (
              <div 
                key={label}
                className={`flex-1 py-4 text-center font-medium text-sm transition-colors ${step >= idx + 1 ? 'text-orange-600 bg-orange-50/50' : 'text-stone-400'}`}
              >
                Step {idx + 1}. {label}
              </div>
            ))}
          </div>

          <div className="p-8 space-y-8">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div 
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <h2 className="text-xl font-bold text-stone-800">請問這次是哪位寶貝要來呢？</h2>
                  {pets.length === 0 ? (
                    <p className="text-stone-500">您還沒有建立寵物檔案，請先回首頁新增。</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      {pets.map(pet => (
                        <div 
                          key={pet.id} 
                          onClick={() => setSelectedPet(pet.id)}
                          className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-4 ${selectedPet === pet.id ? 'border-orange-500 bg-orange-50' : 'border-stone-100 hover:border-stone-200'}`}
                        >
                          <div className="w-12 h-12 rounded-full overflow-hidden bg-stone-200">
                            {pet.avatar_url ? <img src={pet.avatar_url} className="w-full h-full object-cover" /> : <PawPrint className="w-6 h-6 m-3 text-stone-400" />}
                          </div>
                          <div>
                            <h3 className="font-bold text-stone-800">{pet.name}</h3>
                            <p className="text-xs text-stone-500">{pet.breed}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex justify-end pt-4">
                    <button 
                      disabled={!selectedPet}
                      onClick={() => setStep(2)}
                      className="bg-stone-800 text-white px-6 py-3 rounded-xl font-medium disabled:opacity-50"
                    >
                      下一步
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div 
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <h2 className="text-xl font-bold text-stone-800">請選擇服務項目</h2>
                  <div className="space-y-3">
                    {services.map(svc => (
                      <div 
                        key={svc.id} 
                        onClick={() => setSelectedService(svc.id)}
                        className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex justify-between items-center ${selectedService === svc.id ? 'border-orange-500 bg-orange-50' : 'border-stone-100 hover:border-stone-200'}`}
                      >
                        <div>
                          <h3 className="font-bold text-stone-800">{svc.name}</h3>
                          <p className="text-sm text-stone-500">{svc.description} • 約 {svc.duration_minutes} 分鐘</p>
                        </div>
                        <div className="font-bold text-orange-600 text-lg">NT$ {svc.price}</div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between pt-4">
                    <button onClick={() => setStep(1)} className="text-stone-500 font-medium">上一步</button>
                    <button 
                      disabled={!selectedService}
                      onClick={() => setStep(3)}
                      className="bg-stone-800 text-white px-6 py-3 rounded-xl font-medium disabled:opacity-50"
                    >
                      下一步
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div 
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <h2 className="text-xl font-bold text-stone-800">最後，請選擇您希望的時段</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {timeslots.map(slot => {
                      const dateObj = new Date(slot.start_time + "Z");
                      const dateStr = dateObj.toLocaleDateString('zh-TW', { month: '2-digit', day: '2-digit' });
                      const timeStr = dateObj.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false });
                      return (
                        <div 
                          key={slot.id} 
                          onClick={() => setSelectedSlot(slot.id)}
                          className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-4 ${selectedSlot === slot.id ? 'border-orange-500 bg-orange-50' : 'border-stone-100 hover:border-stone-200'}`}
                        >
                          <CalendarIcon className="w-6 h-6 text-stone-400" />
                          <div>
                            <div className="font-bold text-stone-800">{dateStr}</div>
                            <div className="text-sm text-stone-500">{timeStr}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-between pt-4">
                    <button onClick={() => setStep(2)} className="text-stone-500 font-medium">上一步</button>
                    <button 
                      disabled={!selectedSlot || isSubmitting}
                      onClick={handleConfirm}
                      className="bg-gradient-to-r from-orange-500 to-orange-400 text-white px-8 py-3 rounded-xl font-medium shadow-md shadow-orange-500/20 disabled:opacity-50 flex items-center gap-2"
                    >
                      {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle2 className="w-5 h-5" /> 確認預約並結帳</>}
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

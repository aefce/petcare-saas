import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { PawPrint, Mail, Lock, Loader2, UserPlus, Info, Check, ShieldCheck, Sparkles, Heart, ChevronRight, ChevronLeft, CheckCircle2 } from 'lucide-react';
import apiClient from '../api/client';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isGuest, setIsGuest] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await apiClient.post('/api/auth/register', {
        email,
        password,
        name,
        phone,
        is_guest: isGuest
      });

      setIsRegistered(true);
    } catch (err: any) {
      setError(err.response?.data?.detail || '註冊失敗，請檢查輸入內容');
      // If error occurs, let's step back to the step where email/password is entered if we need to correction,
      // but staying at step 3 is also fine.
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    if (step === 1) {
      if (!name || !phone) {
        setError('請填寫姓名與手機號碼');
        return;
      }
      setError('');
      setStep(2);
    } else if (step === 2) {
      if (!email || !password) {
        setError('請填寫電子郵件與密碼');
        return;
      }
      if (password.length < 8) {
        setError('密碼長度最少需要 8 個字元');
        return;
      }
      setLoading(true);
      setError('');
      try {
        const response = await apiClient.get(`/api/auth/check-email?email=${encodeURIComponent(email)}`);
        if (response.data?.exists) {
          setError('此電子郵件已被註冊，請更換其他信箱');
          return;
        }
        setStep(3);
      } catch (err: any) {
        setError('無法驗證電子郵件，請稍後再試');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleBack = () => {
    setError('');
    if (step > 1) {
      setStep(step - 1);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-stone-50 font-sans">
      {/* Left Panel: Slogan & Member Benefits */}
      <div className="hidden lg:flex lg:col-span-5 relative bg-stone-950 flex-col justify-between p-12 overflow-hidden select-none">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

        {/* Top Logo */}
        <div className="relative flex items-center space-x-3 cursor-pointer" onClick={() => navigate("/")}>
          <div className="bg-gradient-to-tr from-amber-400 to-orange-500 text-white p-2.5 rounded-xl shadow-lg shadow-amber-500/20">
            <PawPrint size={24} className="transform -rotate-12" />
          </div>
          <span className="text-xl font-bold text-white tracking-wide">毛星球 PetCare</span>
        </div>

        {/* Middle Brand Slogan */}
        <div className="relative my-auto space-y-8 max-w-md">
          <h2 className="text-4xl font-black text-stone-100 leading-tight">
            加入毛星球，<br />
            為寶貝開啟專屬旅程。
          </h2>
          <p className="text-stone-400 text-base leading-relaxed">
            建立您的專屬帳戶，隨時追蹤毛小孩的每日餵食、健康與照護進度，享有最優質完善的安心託管。
          </p>

          {/* Highlights */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center space-x-3 text-stone-300">
              <div className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                <Check size={14} />
              </div>
              <span className="text-sm font-medium">客製化每日照護與餵食排程</span>
            </div>
            <div className="flex items-center space-x-3 text-stone-300">
              <div className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                <Check size={14} />
              </div>
              <span className="text-sm font-medium">即時健康檢查報告與提醒通知</span>
            </div>
            <div className="flex items-center space-x-3 text-stone-300">
              <div className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                <Check size={14} />
              </div>
              <span className="text-sm font-medium">線上美容與旅館預約管理服務</span>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="relative text-stone-500 text-xs">
          © {new Date().getFullYear()} 毛星球 PetCare. 版權所有.
        </div>
      </div>

      {/* Right Panel: Multistep Form */}
      <div className="lg:col-span-7 flex flex-col justify-center py-12 px-6 sm:px-12 lg:px-20 relative bg-stone-50">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between mb-12">
          <div className="flex items-center space-x-2" onClick={() => navigate("/")}>
            <div className="bg-gradient-to-tr from-amber-400 to-orange-500 text-white p-2 rounded-lg shadow-md">
              <PawPrint size={20} />
            </div>
            <span className="text-lg font-bold text-stone-900">毛星球</span>
          </div>
          <button
            onClick={() => navigate("/login")}
            className="text-sm font-bold text-amber-600 hover:text-amber-700 transition-colors"
          >
            立即登入
          </button>
        </div>

        {/* Inner Container */}
        <div className="mx-auto w-full max-w-md">
          <AnimatePresence mode="wait">
            {!isRegistered ? (
              <motion.div
                key="form-state"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-8"
              >
                {/* Header */}
                <div>
                  <h1 className="text-3xl font-black text-stone-900 tracking-tight">建立新帳號</h1>
                  <p className="text-stone-500 text-sm mt-2">
                    只需要幾個簡單的步驟，就能開啟寶貝的貼心服務。
                  </p>
                </div>

                {/* Step Indicators */}
                <div className="flex items-center space-x-4">
                  {[1, 2, 3].map((s) => (
                    <React.Fragment key={s}>
                      <div className="flex items-center">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                            s === step
                              ? 'bg-amber-500 text-white ring-4 ring-amber-500/20'
                              : s < step
                              ? 'bg-stone-900 text-amber-400'
                              : 'bg-stone-200 text-stone-400'
                          }`}
                        >
                          {s < step ? <Check size={14} className="stroke-[3]" /> : s}
                        </div>
                        <span
                          className={`ml-2 text-xs font-bold ${
                            s === step ? 'text-amber-600' : s < step ? 'text-stone-900' : 'text-stone-400'
                          }`}
                        >
                          {s === 1 ? '基本資料' : s === 2 ? '帳戶設定' : '選擇類型'}
                        </span>
                      </div>
                      {s < 3 && <div className={`flex-1 h-0.5 min-w-[20px] ${s < step ? 'bg-stone-900' : 'bg-stone-200'}`} />}
                    </React.Fragment>
                  ))}
                </div>

                {/* Error Banner */}
                <AnimatePresence mode="wait">
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="bg-rose-50 text-rose-600 p-4 rounded-xl text-sm font-medium border border-rose-100 flex items-center space-x-2"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                      <span>{error}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Form Elements */}
                <form onSubmit={handleRegister} className="space-y-6">
                  {step === 1 && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-4"
                    >
                      <div>
                        <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2 ml-1">
                          真實姓名
                        </label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="例如：王小明"
                          className="w-full bg-white border border-stone-200 text-stone-900 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all placeholder:text-stone-400 font-medium text-sm shadow-sm"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2 ml-1">
                          手機號碼
                        </label>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="0912345678"
                          className="w-full bg-white border border-stone-200 text-stone-900 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all placeholder:text-stone-400 font-medium text-sm shadow-sm"
                          required
                        />
                      </div>
                    </motion.div>
                  )}

                  {step === 2 && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-4"
                    >
                      <div>
                        <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2 ml-1">
                          電子郵件
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="name@example.com"
                            className="w-full bg-white border border-stone-200 text-stone-900 rounded-xl px-12 py-3.5 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all placeholder:text-stone-400 font-medium text-sm shadow-sm"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2 ml-1">
                          設定密碼
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                          <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="最少 8 個字元"
                            minLength={8}
                            className="w-full bg-white border border-stone-200 text-stone-900 rounded-xl px-12 py-3.5 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all placeholder:text-stone-400 font-medium text-sm shadow-sm"
                            required
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {step === 3 && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-4 animate-fade-in"
                    >
                      <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2 ml-1">
                        請選擇您的帳號類型
                      </label>

                      <div className="grid grid-cols-1 gap-4">
                        {/* Member Option Card */}
                        <div
                          onClick={() => setIsGuest(false)}
                          className={`p-4 border-2 rounded-xl cursor-pointer transition-all flex flex-col justify-between ${
                            !isGuest
                              ? 'border-amber-500 bg-amber-50/20 shadow-md shadow-amber-500/5'
                              : 'border-stone-200 bg-white hover:border-stone-300'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-3">
                              <div className={`p-2 rounded-lg ${!isGuest ? 'bg-amber-500 text-white' : 'bg-stone-100 text-stone-500'}`}>
                                <Heart size={18} />
                              </div>
                              <div>
                                <h4 className="font-bold text-stone-900 text-sm">正式會員帳號</h4>
                                <p className="text-xs text-stone-500 mt-0.5">享有完整服務，適用於一般寵物家長</p>
                              </div>
                            </div>
                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                              !isGuest ? 'border-amber-500 bg-amber-500 text-white' : 'border-stone-300'
                            }`}>
                              {!isGuest && <Check size={12} className="stroke-[3]" />}
                            </div>
                          </div>
                          <div className="mt-3 text-xs text-stone-600 bg-stone-100/50 p-2.5 rounded-lg border border-stone-200/50 leading-relaxed">
                            解鎖所有功能，包含線上預約美容、預約旅館、管理毛孩資料與即時進度追蹤。
                          </div>
                        </div>

                        {/* Guest Option Card */}
                        <div
                          onClick={() => setIsGuest(true)}
                          className={`p-4 border-2 rounded-xl cursor-pointer transition-all flex flex-col justify-between ${
                            isGuest
                              ? 'border-amber-500 bg-amber-50/20 shadow-md shadow-amber-500/5'
                              : 'border-stone-200 bg-white hover:border-stone-300'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-3">
                              <div className={`p-2 rounded-lg ${isGuest ? 'bg-amber-500 text-white' : 'bg-stone-100 text-stone-500'}`}>
                                <Info size={18} />
                              </div>
                              <div>
                                <h4 className="font-bold text-stone-900 text-sm">臨時訪客帳號</h4>
                                <p className="text-xs text-stone-500 mt-0.5">30天失效，僅供進度查看</p>
                              </div>
                            </div>
                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                              isGuest ? 'border-amber-500 bg-amber-500 text-white' : 'border-stone-300'
                            }`}>
                              {isGuest && <Check size={12} className="stroke-[3]" />}
                            </div>
                          </div>
                          <div className="mt-3 text-xs text-stone-600 bg-stone-100/50 p-2.5 rounded-lg border border-stone-200/50 leading-relaxed">
                            免除繁雜步驟，僅供查看特定毛孩托育與照護進度。帳號將於 <span className="text-amber-600 font-bold">30 天後自動失效</span>，且無法使用線上預約功能。
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Navigation Buttons */}
                  <div className="flex items-center space-x-4 pt-4">
                    {step > 1 && (
                      <button
                        type="button"
                        onClick={handleBack}
                        className="flex items-center justify-center space-x-1.5 px-4 py-3.5 border border-stone-200 text-stone-700 bg-white hover:bg-stone-50 font-bold rounded-xl transition-all text-sm shrink-0"
                      >
                        <ChevronLeft size={16} />
                        <span>上一步</span>
                      </button>
                    )}
                    
                    {step < 3 ? (
                      <button
                        type="button"
                        onClick={handleNext}
                        disabled={loading}
                        className="flex-1 bg-stone-900 hover:bg-stone-800 text-white font-bold py-3.5 rounded-xl shadow-lg flex items-center justify-center space-x-1.5 transition-all text-sm disabled:opacity-75 disabled:cursor-not-allowed"
                      >
                        {loading ? (
                          <Loader2 className="animate-spin" size={16} />
                        ) : (
                          <>
                            <span>下一步</span>
                            <ChevronRight size={16} />
                          </>
                        )}
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-amber-500/10 flex items-center justify-center space-x-2 disabled:opacity-75 disabled:cursor-not-allowed transition-all text-sm"
                      >
                        {loading ? (
                          <Loader2 className="animate-spin" size={18} />
                        ) : (
                          <>
                            <UserPlus size={18} />
                            <span>{isGuest ? '註冊臨時訪客帳號' : '註冊正式會員帳號'}</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </form>
              </motion.div>
            ) : (
              // Success Screen (Replaces alert window)
              <motion.div
                key="success-state"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-6"
              >
                <div className="mx-auto w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shadow-lg shadow-emerald-100/30">
                  <CheckCircle2 size={36} className="animate-bounce" />
                </div>
                <div className="space-y-2">
                  <h1 className="text-3xl font-black text-stone-900">帳號註冊成功！</h1>
                  <p className="text-stone-500 text-sm max-w-sm mx-auto leading-relaxed">
                    {isGuest 
                      ? '您的臨時訪客帳號已註冊成功！帳號有效期限為 30 天，可登入查看寵物照護狀態。'
                      : '您的正式會員帳號已註冊成功！歡迎加入毛星球大家庭。'
                    }
                  </p>
                </div>
                
                <div className="bg-stone-100/80 border border-stone-200/50 p-4 rounded-xl text-left max-w-sm mx-auto space-y-2.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-stone-400">登入信箱：</span>
                    <span className="text-stone-800">{email}</span>
                  </div>
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-stone-400">聯絡姓名：</span>
                    <span className="text-stone-800">{name}</span>
                  </div>
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-stone-400">帳號類型：</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      isGuest ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {isGuest ? '臨時訪客' : '正式會員'}
                    </span>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => navigate('/login')}
                  className="w-full max-w-sm bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-amber-500/10 flex items-center justify-center space-x-2 transition-all text-sm mx-auto"
                >
                  <span>前往登入頁面</span>
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-8 text-center text-sm font-medium text-stone-500">
            已經有帳號了嗎？{" "}
            <button
              onClick={() => navigate("/login")}
              className="text-amber-600 hover:text-amber-700 font-bold transition-colors"
            >
              立即登入
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;

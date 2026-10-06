import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { PawPrint, Mail, Lock, Loader2, Sparkles, Heart, Shield } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import apiClient from "../api/client";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // OAuth2 requires form data
      const formData = new URLSearchParams();
      formData.append("username", email);
      formData.append("password", password);

      const res = await apiClient.post("/api/auth/login", formData, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      const token = res.data.access_token;
      
      // Fetch user profile
      const meRes = await apiClient.get("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` }
      });

      setAuth(token, meRes.data);
      window.location.href = "/";
    } catch (err: any) {
      setError(err.response?.data?.detail || "登入失敗，請檢查信箱或密碼");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-stone-50 font-sans">
      {/* Left panel: Brand Showcase (Hidden on mobile) */}
      <div className="hidden lg:flex lg:col-span-5 relative bg-stone-950 flex-col justify-between p-12 overflow-hidden select-none">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

        {/* Top: Logo */}
        <div className="relative flex items-center space-x-3 cursor-pointer" onClick={() => navigate("/")}>
          <div className="bg-gradient-to-tr from-amber-400 to-orange-500 text-white p-2.5 rounded-xl shadow-lg shadow-amber-500/20">
            <PawPrint size={24} className="transform -rotate-12" />
          </div>
          <span className="text-xl font-bold text-white tracking-wide">毛星球 PetCare</span>
        </div>

        {/* Middle: Brand Slogan */}
        <div className="relative my-auto space-y-8 max-w-md">
          <h2 className="text-4xl font-black text-stone-100 leading-tight">
            給寵物最溫暖的家，<br />
            讓您最放心的托育選擇。
          </h2>
          <p className="text-stone-400 text-base leading-relaxed">
            我們提供 24 小時無縫照護、專業美容美容以及五星級的豪華旅館服務，隨時透過儀表板監控您寶貝的每日狀態。
          </p>

          {/* Highlights */}
          <div className="space-y-5 pt-4">
            <div className="flex items-start space-x-4">
              <div className="bg-stone-900 text-amber-400 p-2 rounded-lg border border-stone-800">
                <Shield size={20} />
              </div>
              <div>
                <h4 className="text-white font-semibold text-sm">全天候智能照護</h4>
                <p className="text-stone-400 text-xs mt-1">24小時攝影監控與專業照護人員隨時待命</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="bg-stone-900 text-amber-400 p-2 rounded-lg border border-stone-800">
                <Sparkles size={20} />
              </div>
              <div>
                <h4 className="text-white font-semibold text-sm">精緻寵物美容</h4>
                <p className="text-stone-400 text-xs mt-1">依寵物膚質客製化的溫和洗剪保養療程</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="bg-stone-900 text-amber-400 p-2 rounded-lg border border-stone-800">
                <Heart size={20} />
              </div>
              <div>
                <h4 className="text-white font-semibold text-sm">五星級頂級旅館</h4>
                <p className="text-stone-400 text-xs mt-1">獨立溫控通風套房與每日放風定時回報</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="relative text-stone-500 text-xs">
          © {new Date().getFullYear()} 毛星球 PetCare. 版權所有.
        </div>
      </div>

      {/* Right panel: Login Form */}
      <div className="lg:col-span-7 flex flex-col justify-center py-12 px-6 sm:px-12 lg:px-20 relative bg-stone-50">
        {/* Mobile Header (Visible on mobile only) */}
        <div className="lg:hidden flex items-center justify-between mb-12">
          <div className="flex items-center space-x-2" onClick={() => navigate("/")}>
            <div className="bg-gradient-to-tr from-amber-400 to-orange-500 text-white p-2 rounded-lg shadow-md">
              <PawPrint size={20} />
            </div>
            <span className="text-lg font-bold text-stone-900">毛星球</span>
          </div>
          <button
            onClick={() => navigate("/register")}
            className="text-sm font-bold text-amber-600 hover:text-amber-700 transition-colors"
          >
            立即註冊
          </button>
        </div>

        {/* Form Container */}
        <div className="mx-auto w-full max-w-md">
          <div className="mb-10 text-left">
            <h1 className="text-3xl font-black text-stone-900 tracking-tight">帳號登入</h1>
            <p className="text-stone-500 text-sm mt-2">
              歡迎回來！請輸入您的電子信箱與密碼開始使用系統。
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-100 flex items-center space-x-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2 ml-1">
                  電子信箱
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
                <div className="flex justify-between items-center mb-2 ml-1">
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                    登入密碼
                  </label>
                  <a href="#" className="text-xs font-semibold text-amber-600 hover:text-amber-700 transition-colors">
                    忘記密碼？
                  </a>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="請輸入密碼"
                    className="w-full bg-white border border-stone-200 text-stone-900 rounded-xl px-12 py-3.5 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all placeholder:text-stone-400 font-medium text-sm shadow-sm"
                    required
                  />
                </div>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              disabled={isLoading}
              type="submit"
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-amber-500/10 flex items-center justify-center space-x-2 disabled:opacity-75 disabled:cursor-not-allowed transition-all text-sm tracking-wide"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <span>安全登入</span>
              )}
            </motion.button>
          </form>

          <div className="mt-8 text-center text-sm font-medium text-stone-500">
            還沒有註冊帳號？{" "}
            <button
              onClick={() => navigate("/register")}
              className="text-amber-600 hover:text-amber-700 font-bold transition-colors"
            >
              立即免費註冊
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

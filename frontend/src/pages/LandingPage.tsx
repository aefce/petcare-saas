import { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Scissors, Hotel, Heart, Shield, Star, ChevronDown, 
  Phone, Mail, MapPin, ArrowRight, PawPrint, Sparkles, Check, Menu, X
} from 'lucide-react';

const NAV_LINKS = [
  { label: '服務項目', href: '#services' },
  { label: '為何選擇我們', href: '#why-us' },
  { label: '顧客評價', href: '#testimonials' },
  { label: '常見問題', href: '/faq' },
  { label: '聯絡我們', href: '#contact' },
];

const SERVICES = [
  {
    icon: Scissors,
    emoji: '✂️',
    title: '寵物美容沙龍',
    desc: '由專業認證美容師提供全套洗護服務，包含特殊造型剪裁、芳療 SPA 與美甲護理，讓您的毛寶貝煥然一新。',
    color: 'from-amber-400 to-orange-500',
    bg: 'bg-amber-50',
    border: 'border-amber-100',
    img: '/grooming.png',
    path: '/services/grooming',
  },
  {
    icon: Hotel,
    emoji: '🏨',
    title: '寵物精品旅館',
    desc: '提供獨立套房、24 小時監控與人員陪護。不論是商旅出差還是旅遊度假，都讓您的寵物安心放假。',
    color: 'from-teal-400 to-emerald-500',
    bg: 'bg-teal-50',
    border: 'border-teal-100',
    img: '/hotel.png',
    path: '/services/hotel',
  },
  {
    icon: Heart,
    emoji: '🩺',
    title: '日常健康照護',
    desc: '資深照護員提供每日餵食紀錄、健康監測、排泄狀況回報與定期活動，並即時同步照片給您安心。',
    color: 'from-rose-400 to-pink-500',
    bg: 'bg-rose-50',
    border: 'border-rose-100',
    img: '/hero.png',
    path: '/services/care',
  },
];

const REASONS = [
  { icon: Shield, title: '疫苗合規強制驗證', desc: '所有入住寵物皆需通過疫苗証明審核，確保整體環境的安全與健康。' },
  { icon: Sparkles, title: '即時服務動態推播', desc: '透過線上系統，美容進度與照護日誌照片即時同步至您的手機。' },
  { icon: PawPrint, title: '專業團隊 24hr 陪護', desc: '所有員工持有國際認證寵物美容師或照護師資格，提供全天候看護。' },
  { icon: Star, title: '彈性多元預約系統', desc: '線上預約、選擇房型、即時確認，數分鐘內完成您所有的安排。' },
];

const TESTIMONIALS = [
  { name: '陳小姐 • 拉布拉多 Coco 的飼主', stars: 5, text: '我家 Coco 第一次住進去都不想回家了！照護員每天傳照片給我，讓我出差也非常放心，設施環境真的超乾淨的！' },
  { name: '王先生 • 布偶貓 Mochi 的飼主', stars: 5, text: '美容師的技術非常專業，每次去都把 Mochi 打理得漂漂亮亮，而且對貓咪很有耐心，完全不像其他家那樣給貓咪壓力。' },
  { name: '林小姐 • 柴犬 Taro 的飼主', stars: 5, text: '我最欣賞他們的疫苗驗證機制，知道和 Taro 一起住的鄰居都是健康的寵物，這點讓我完全放心託付。' },
];

const PLANS = [
  {
    name: '日間美容',
    price: 'NT$ 800 起',
    period: '每次',
    color: 'border-amber-400',
    headerBg: 'bg-amber-500',
    features: ['全套洗護', '吹整造型', '耳朵清潔', '指甲修剪', '完成前後對比照'],
    cta: '立即預約',
    path: '/login',
  },
  {
    name: '精品旅館',
    price: 'NT$ 1,200 起',
    period: '每晚',
    color: 'border-teal-500',
    headerBg: 'bg-gradient-to-br from-teal-500 to-emerald-600',
    popular: true,
    features: ['獨立空調套房', '24h 人員陪護', '每日健康日誌', '三餐餵食服務', '即時照片同步', '疫苗合規環境'],
    cta: '查看房型',
    path: '/services/hotel',
  },
  {
    name: '年度會員',
    price: 'NT$ 8,800',
    period: '每年',
    color: 'border-orange-500',
    headerBg: 'bg-gradient-to-br from-orange-500 to-amber-600',
    features: ['無限次美容 85 折', '旅館優先預訂', '專屬照護員配對', '免費健康諮詢', '生日驚喜禮', '疫苗提醒服務'],
    cta: '了解更多',
    path: '/membership',
  },
];

function Navbar({ 
  onLoginClick, 
  onRegisterClick 
}: { 
  onLoginClick: () => void; 
  onRegisterClick: () => void; 
}) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navigate = useNavigate();

  const scrollTo = (href: string) => {
    if (href.startsWith('#')) {
      const el = document.querySelector(href);
      el?.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate(href);
    }
    setMenuOpen(false);
  };

  return (
    <motion.nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? 'bg-white/90 backdrop-blur-xl shadow-sm border-b border-stone-100' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-200">
            <PawPrint className="w-5 h-5 text-white" />
          </div>
          <span className={`font-black text-xl tracking-tight transition-colors ${scrolled ? 'text-stone-900' : 'text-white'}`}>
            毛星球寵物照護
          </span>
        </div>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map(link => (
            <button
              key={link.href}
              onClick={() => scrollTo(link.href)}
              className={`text-sm font-medium transition-colors hover:text-orange-500 ${
                scrolled ? 'text-stone-600' : 'text-white/90'
              }`}
            >
              {link.label}
            </button>
          ))}
          <button
            onClick={onLoginClick}
            className={`text-sm font-bold transition-colors hover:text-orange-500 ${
              scrolled ? 'text-stone-700' : 'text-white/90'
            }`}
          >
            登入
          </button>
          <button
            onClick={onRegisterClick}
            className="bg-gradient-to-r from-amber-400 to-orange-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-orange-200/50 hover:shadow-orange-300/60 hover:-translate-y-0.5 transition-all duration-300"
          >
            免費註冊
          </button>
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className={`md:hidden p-2 rounded-xl transition-colors ${scrolled ? 'text-stone-700' : 'text-white'}`}
        >
          {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile dropdown */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-stone-100 px-6 py-4 space-y-3"
          >
            {NAV_LINKS.map(link => (
              <button
                key={link.href}
                onClick={() => scrollTo(link.href)}
                className="block w-full text-left text-stone-700 font-medium py-2 hover:text-orange-500 transition-colors"
              >
                {link.label}
              </button>
            ))}
            <div className="pt-2 border-t border-stone-100 flex flex-col gap-2">
              <button
                onClick={onLoginClick}
                className="w-full py-2.5 rounded-xl font-bold border border-stone-200 text-stone-700 text-center hover:bg-stone-50 transition-colors"
              >
                會員登入
              </button>
              <button
                onClick={onRegisterClick}
                className="w-full bg-gradient-to-r from-amber-400 to-orange-500 text-white py-2.5 rounded-xl font-bold text-center shadow-lg shadow-orange-200/40"
              >
                免費註冊
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}

function HeroSection({ onLoginClick }: { onLoginClick: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <section ref={ref} className="relative min-h-screen flex items-center overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-stone-900 via-stone-800 to-amber-900" />
      
      {/* Decorative blobs */}
      <motion.div style={{ y }} className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 right-10 w-96 h-96 bg-orange-400/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-10 w-80 h-80 bg-amber-300/15 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-teal-400/10 rounded-full blur-3xl" />
      </motion.div>

      {/* Pattern */}
      <div className="absolute inset-0 opacity-[0.04]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }} />

      <motion.div
        style={{ opacity }}
        className="relative z-10 max-w-7xl mx-auto px-6 py-32 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center"
      >
        {/* Left text */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 text-amber-300 text-sm font-bold px-4 py-2 rounded-full mb-8"
          >
            <Sparkles className="w-4 h-4" />
            全台首選 · 寵物五星級照護
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="text-5xl md:text-7xl font-black text-white leading-tight tracking-tight"
          >
            給毛寶貝<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-orange-400">
              最好的生活
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.2 }}
            className="mt-6 text-xl text-white/70 leading-relaxed max-w-lg"
          >
            提供專業寵物美容、精品旅館住宿與全方位健康照護。每一次託付，都是一份信任，我們全力守護。
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.3 }}
            className="mt-10 flex flex-col sm:flex-row gap-4"
          >
            <button
              onClick={onLoginClick}
              className="group flex items-center justify-center gap-2 bg-gradient-to-r from-amber-400 to-orange-500 text-white px-8 py-4 rounded-2xl text-lg font-bold shadow-xl shadow-orange-500/30 hover:shadow-orange-500/50 hover:-translate-y-1 transition-all duration-300"
            >
              立即線上預約
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => document.querySelector('#services')?.scrollIntoView({ behavior: 'smooth' })}
              className="flex items-center justify-center gap-2 bg-white/10 backdrop-blur border border-white/20 text-white px-8 py-4 rounded-2xl text-lg font-bold hover:bg-white/20 transition-all duration-300"
            >
              了解更多服務
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-12 flex items-center gap-8"
          >
            {[{ val: '5,000+', label: '快樂寵物' }, { val: '98%', label: '飼主好評' }, { val: '7年', label: '業界經驗' }].map(stat => (
              <div key={stat.label}>
                <div className="text-2xl font-black text-white">{stat.val}</div>
                <div className="text-sm text-white/60 mt-0.5">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Right image */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, x: 40 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="relative hidden lg:block"
        >
          <div className="relative w-full aspect-square">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-400/30 to-orange-500/20 rounded-[3rem] blur-2xl" />
            <div className="relative bg-white/10 backdrop-blur border border-white/20 rounded-[3rem] overflow-hidden">
              <img src="/hero.png" alt="寵物照護" className="w-full h-full object-cover" />
            </div>
            {/* Floating badges */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
              className="absolute -bottom-4 -left-6 bg-white rounded-2xl p-4 shadow-2xl flex items-center gap-3"
            >
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-xl">⭐</div>
              <div>
                <div className="text-xs font-bold text-stone-500">本週評分</div>
                <div className="text-lg font-black text-stone-800">4.98 / 5</div>
              </div>
            </motion.div>
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut', delay: 0.5 }}
              className="absolute -top-4 -right-6 bg-white rounded-2xl p-4 shadow-2xl flex items-center gap-3"
            >
              <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center text-xl">🛡️</div>
              <div>
                <div className="text-xs font-bold text-stone-500">安全保障</div>
                <div className="text-sm font-black text-stone-800">疫苗合規驗證</div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>

      {/* Scroll down */}
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/50 flex flex-col items-center gap-2"
      >
        <span className="text-xs font-medium tracking-widest uppercase">向下滑動</span>
        <ChevronDown className="w-5 h-5" />
      </motion.div>
    </section>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();

  const handleLoginClick = () => {
    navigate('/login');
  };

  const handleRegisterClick = () => {
    navigate('/register');
  };

  return (
    <div className="bg-white font-sans">
      <Navbar onLoginClick={handleLoginClick} onRegisterClick={handleRegisterClick} />

      <HeroSection onLoginClick={handleLoginClick} />

      {/* Services Section */}
      <section id="services" className="py-32 bg-stone-50">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <span className="text-amber-500 font-bold text-sm tracking-widest uppercase">Our Services</span>
            <h2 className="mt-3 text-4xl md:text-5xl font-black text-stone-900 tracking-tight">
              全方位的寵物照護服務
            </h2>
            <p className="mt-4 text-xl text-stone-500 max-w-2xl mx-auto">
              從美容梳理到旅館住宿，我們提供您毛寶貝所需的一切。
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {SERVICES.map((svc, i) => (
              <motion.div
                key={svc.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                whileHover={{ y: -8 }}
                className={`${svc.bg} border ${svc.border} rounded-3xl overflow-hidden group cursor-pointer`}
              >
                <div className="aspect-video overflow-hidden">
                  <img
                    src={svc.img}
                    alt={svc.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-8">
                  <div className={`inline-flex items-center gap-2 bg-gradient-to-r ${svc.color} text-white text-sm font-bold px-4 py-1.5 rounded-full mb-4`}>
                    {svc.emoji} {svc.title}
                  </div>
                  <p className="text-stone-600 leading-relaxed">{svc.desc}</p>
                  <button
                    onClick={() => navigate(svc.path)}
                    className="mt-6 flex items-center gap-1 text-sm font-bold text-stone-700 hover:text-orange-500 transition-colors group/btn"
                  >
                    了解詳情
                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why us Section */}
      <section id="why-us" className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className="text-amber-500 font-bold text-sm tracking-widest uppercase">Why Choose Us</span>
              <h2 className="mt-3 text-4xl md:text-5xl font-black text-stone-900 tracking-tight leading-tight">
                讓每次信任<br />都物超所值
              </h2>
              <p className="mt-5 text-xl text-stone-500 leading-relaxed">
                從嚴格的疫苗把關到即時日誌回傳，我們以透明、專業、溫暖建立每一份信任關係。
              </p>
              <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-6">
                {REASONS.map((r, i) => (
                  <motion.div
                    key={r.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex gap-4"
                  >
                    <div className="w-12 h-12 shrink-0 bg-amber-50 border border-amber-100 rounded-2xl flex items-center justify-center">
                      <r.icon className="w-6 h-6 text-amber-500" />
                    </div>
                    <div>
                      <h3 className="font-bold text-stone-800">{r.title}</h3>
                      <p className="text-sm text-stone-500 mt-1 leading-relaxed">{r.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-amber-100 to-orange-100 rounded-[3rem] -rotate-3" />
              <img src="/hotel.png" alt="寵物旅館" className="relative rounded-[2.5rem] w-full object-cover shadow-2xl shadow-orange-100" />
              <div className="absolute -bottom-6 -right-6 bg-white rounded-2xl p-6 shadow-xl border border-stone-100">
                <div className="text-sm font-bold text-stone-500 mb-3">今日入住狀態</div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse" />
                  <span className="font-bold text-stone-800">房間充足・可立即預訂</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-32 bg-gradient-to-br from-stone-900 to-stone-800 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.06]" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }} />
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-1/4 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <span className="text-amber-400 font-bold text-sm tracking-widest uppercase">Pricing</span>
            <h2 className="mt-3 text-4xl md:text-5xl font-black text-white tracking-tight">
              透明定價・沒有隱藏費用
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {PLANS.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className={`relative bg-white/5 backdrop-blur border-2 ${plan.color} rounded-3xl overflow-hidden flex flex-col ${plan.popular ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-stone-900' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute top-4 right-4 bg-amber-400 text-stone-900 text-xs font-black px-3 py-1 rounded-full">
                    ⭐ 最受歡迎
                  </div>
                )}
                <div className={`${plan.headerBg} p-8`}>
                  <h3 className="text-xl font-black text-white">{plan.name}</h3>
                  <div className="mt-4">
                    <span className="text-4xl font-black text-white">{plan.price}</span>
                    <span className="text-white/60 ml-2">/ {plan.period}</span>
                  </div>
                </div>
                <div className="p-8 flex flex-col flex-1">
                  <ul className="space-y-3 flex-1">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-center gap-3 text-white/80 text-sm">
                        <Check className="w-4 h-4 text-amber-400 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => navigate(plan.path)}
                    className={`mt-8 w-full py-3.5 rounded-xl font-bold transition-all duration-300 hover:-translate-y-0.5 ${
                      plan.popular
                        ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-lg shadow-orange-500/30'
                        : 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
                    }`}
                  >
                    {plan.cta}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-32 bg-amber-50">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <span className="text-amber-500 font-bold text-sm tracking-widest uppercase">Testimonials</span>
            <h2 className="mt-3 text-4xl md:text-5xl font-black text-stone-900 tracking-tight">
              飼主的真實心聲
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="bg-white rounded-3xl p-8 shadow-sm border border-amber-100 hover:shadow-md transition-shadow"
              >
                <div className="flex gap-1 mb-6">
                  {Array.from({ length: t.stars }).map((_, j) => (
                    <Star key={j} className="w-5 h-5 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-stone-600 leading-relaxed text-[15px]">「{t.text}」</p>
                <div className="mt-6 pt-6 border-t border-stone-100">
                  <p className="font-bold text-stone-800 text-sm">{t.name}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className="text-amber-500 font-bold text-sm tracking-widest uppercase">Contact Us</span>
              <h2 className="mt-3 text-4xl md:text-5xl font-black text-stone-900 tracking-tight leading-tight">
                有任何問題<br />歡迎聯絡我們
              </h2>
              <p className="mt-5 text-xl text-stone-500">我們的客服團隊在週一至週日 08:00 – 20:00 為您服務。</p>

              <div className="mt-10 space-y-6">
                {[
                  { icon: Phone, label: '電話', val: '02-1234-5678' },
                  { icon: Mail, label: '電子信箱', val: 'hello@mao-planet.tw' },
                  { icon: MapPin, label: '地址', val: '台北市大安區忠孝東路四段 100 號 5F' },
                ].map(item => (
                  <div key={item.label} className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-amber-50 border border-amber-100 rounded-2xl flex items-center justify-center shrink-0">
                      <item.icon className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-stone-400">{item.label}</div>
                      <div className="font-bold text-stone-800 mt-0.5">{item.val}</div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-stone-50 rounded-3xl p-10 border border-stone-100"
            >
              <h3 className="text-2xl font-black text-stone-900 mb-8">傳送訊息給我們</h3>
              <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); alert('訊息已送出！我們將盡快聯絡您。'); }}>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-stone-600 mb-2">姓名</label>
                    <input type="text" className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-400 bg-white" placeholder="您的姓名" required />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-stone-600 mb-2">電話</label>
                    <input type="tel" className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-400 bg-white" placeholder="09xx-xxx-xxx" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-600 mb-2">電子信箱</label>
                  <input type="email" className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-400 bg-white" placeholder="your@email.com" required />
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-600 mb-2">詢問內容</label>
                  <textarea rows={4} className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-400 bg-white resize-none" placeholder="告訴我們您想問什麼..." required />
                </div>
                <button type="submit" className="w-full bg-gradient-to-r from-amber-400 to-orange-500 text-white py-4 rounded-xl font-bold text-base hover:-translate-y-0.5 hover:shadow-lg hover:shadow-orange-200 transition-all duration-300">
                  送出訊息
                </button>
              </form>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-stone-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center">
                <PawPrint className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="font-black text-lg">毛星球寵物照護</div>
                <div className="text-stone-400 text-sm">MAO PLANET PET CARE</div>
              </div>
            </div>
            <div className="text-stone-400 text-sm text-center">
              © 2025 毛星球寵物照護. All rights reserved. | 設計與系統由軟體設計課程製作
            </div>
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="flex gap-4">
                {NAV_LINKS.map(link => (
                  <button
                    key={link.href}
                    onClick={() => {
                      if (link.href.startsWith('#')) {
                        document.querySelector(link.href)?.scrollIntoView({ behavior: 'smooth' });
                      } else {
                        navigate(link.href);
                      }
                    }}
                    className="text-stone-400 hover:text-white text-sm transition-colors"
                  >
                    {link.label}
                  </button>
                ))}
              </div>
              <div className="w-px h-4 bg-stone-700 hidden md:block" />
              <div className="flex gap-4">
                <Link to="/terms" className="text-stone-400 hover:text-white text-sm transition-colors">服務條款</Link>
                <Link to="/privacy" className="text-stone-400 hover:text-white text-sm transition-colors">隱私權政策</Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PawPrint, ChevronRight, Menu, X, ArrowLeft,
  Scissors, Hotel, Heart, Users, HelpCircle, FileText, Shield
} from 'lucide-react';

const DOC_SECTIONS = [
  { label: '服務介紹', icon: null, isGroup: true },
  { label: '寵物美容沙龍', href: '/services/grooming', icon: Scissors },
  { label: '寵物精品旅館', href: '/services/hotel', icon: Hotel },
  { label: '日常健康照護', href: '/services/care', icon: Heart },
  { label: '其他資訊', icon: null, isGroup: true },
  { label: '會員方案說明', href: '/membership', icon: Users },
  { label: '常見問題 FAQ', href: '/faq', icon: HelpCircle },
  { label: '服務條款', href: '/terms', icon: FileText },
  { label: '隱私權政策', href: '/privacy', icon: Shield },
];

interface Breadcrumb {
  label: string;
  href?: string;
}

interface DocLayoutProps {
  breadcrumbs: Breadcrumb[];
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  accentColor?: string; // e.g., 'amber', 'teal', 'rose'
}

export default function DocLayout({
  breadcrumbs,
  title,
  subtitle,
  children,
  accentColor = 'amber',
}: DocLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  // Track scroll progress
  useEffect(() => {
    const handleScroll = () => {
      const el = document.documentElement;
      const scrolled = el.scrollTop;
      const total = el.scrollHeight - el.clientHeight;
      setScrollProgress(total > 0 ? (scrolled / total) * 100 : 0);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const accentClasses: Record<string, string> = {
    amber: 'from-amber-400 to-orange-500',
    teal: 'from-teal-400 to-emerald-500',
    rose: 'from-rose-400 to-pink-500',
    purple: 'from-violet-400 to-purple-500',
  };
  const gradient = accentClasses[accentColor] ?? accentClasses.amber;

  const Sidebar = () => (
    <div className="w-72 shrink-0">
      <div className="sticky top-24 space-y-1">
        <div className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-4 px-3">文件導覽</div>
        {DOC_SECTIONS.map((item, idx) => {
          if (item.isGroup) {
            return (
              <div key={idx} className="text-xs font-black text-stone-500 uppercase tracking-widest pt-5 pb-2 px-3">
                {item.label}
              </div>
            );
          }
          const Icon = item.icon;
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href!}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-amber-50 text-amber-700 font-bold border border-amber-200'
                  : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
              }`}
            >
              {Icon && <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-amber-500' : 'text-stone-400'}`} />}
              {item.label}
              {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto text-amber-500" />}
            </Link>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-stone-50 font-sans">
      {/* Reading Progress */}
      <div className="fixed top-0 left-0 right-0 h-0.5 bg-stone-100 z-50">
        <motion.div
          className={`h-full bg-gradient-to-r ${gradient}`}
          style={{ width: `${scrollProgress}%` }}
          transition={{ ease: 'linear' }}
        />
      </div>

      {/* Topbar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-stone-100 shadow-sm">
        <div className="max-w-screen-xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          {/* Left: Logo + Back */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition-colors"
              aria-label="返回上一頁"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center shadow-md shadow-orange-200">
                <PawPrint className="w-4.5 h-4.5 text-white" />
              </div>
              <span className="font-black text-stone-900 text-lg tracking-tight hidden sm:block">毛星球</span>
            </Link>

            {/* Breadcrumbs */}
            <div className="hidden sm:flex items-center gap-1 ml-2 text-sm">
              <span className="text-stone-300">/</span>
              {breadcrumbs.map((bc, i) => (
                <span key={i} className="flex items-center gap-1">
                  {bc.href ? (
                    <Link to={bc.href} className="text-stone-400 hover:text-stone-700 transition-colors">
                      {bc.label}
                    </Link>
                  ) : (
                    <span className="text-stone-700 font-semibold">{bc.label}</span>
                  )}
                  {i < breadcrumbs.length - 1 && <ChevronRight className="w-3.5 h-3.5 text-stone-300" />}
                </span>
              ))}
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="hidden sm:block text-sm font-bold text-stone-600 hover:text-orange-500 transition-colors"
            >
              登入
            </Link>
            <Link
              to="/register"
              className="bg-gradient-to-r from-amber-400 to-orange-500 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md shadow-orange-200/50 hover:-translate-y-0.5 transition-all duration-200"
            >
              免費註冊
            </Link>
            {/* Mobile menu toggle */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-xl text-stone-600 hover:bg-stone-100 transition-colors"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 z-30 bg-black/30 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="lg:hidden fixed left-0 top-16 bottom-0 w-72 z-40 bg-white border-r border-stone-100 p-6 overflow-y-auto"
            >
              <Sidebar />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="max-w-screen-xl mx-auto px-6 py-10 flex gap-12">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block">
          <Sidebar />
        </aside>

        {/* Content */}
        <main ref={contentRef} className="flex-1 min-w-0">
          {/* Page header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <div className={`inline-block bg-gradient-to-r ${gradient} rounded-full px-4 py-1.5 text-white text-xs font-bold uppercase tracking-widest mb-5 shadow-sm`}>
              毛星球服務文件
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-stone-900 tracking-tight leading-tight">{title}</h1>
            {subtitle && <p className="mt-4 text-xl text-stone-500 leading-relaxed max-w-2xl">{subtitle}</p>}
            <div className="mt-6 h-1 w-20 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full" />
          </motion.div>

          {/* Page content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="prose-doc"
          >
            {children}
          </motion.div>

          {/* Footer nav */}
          <div className="mt-16 pt-8 border-t border-stone-200 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 text-sm text-stone-500 hover:text-stone-900 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              返回首頁
            </Link>
            <Link to="/register" className="flex items-center gap-2 text-sm font-bold text-orange-500 hover:text-orange-600 transition-colors">
              立即免費註冊
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}

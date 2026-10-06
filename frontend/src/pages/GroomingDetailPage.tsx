import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Check, ArrowRight, Clock, Scissors, Star, AlertCircle } from 'lucide-react';
import DocLayout from '../components/layout/DocLayout';

const PACKAGES = [
  {
    name: '基礎美容',
    price: 'NT$ 800 起',
    duration: '約 2-3 小時',
    color: 'border-amber-300',
    headerBg: 'bg-amber-500',
    features: ['全身清洗', '吹毛造型', '耳道清潔', '指甲修剪', '完成對比照 1 張'],
  },
  {
    name: '精緻全套美容',
    price: 'NT$ 1,200 起',
    duration: '約 3-4 小時',
    color: 'border-orange-400',
    headerBg: 'bg-gradient-to-br from-amber-500 to-orange-500',
    popular: true,
    features: ['基礎美容全包', '深層滋養護毛', '造型剪裁（選款）', '香水噴霧（選香）', '完成對比照 3 張', '服務日誌回傳'],
  },
  {
    name: '頂級 SPA 套裝',
    price: 'NT$ 2,000 起',
    duration: '約 4-5 小時',
    color: 'border-rose-300',
    headerBg: 'bg-gradient-to-br from-rose-400 to-pink-500',
    features: ['精緻全套美容全包', '芳療草本浴', '牙齒清潔', '眼周護理', '美甲彩繪（選款）', 'VIP 等候室休息', '完成對比照 5 張'],
  },
];

const STEPS = [
  { step: '01', title: '線上預約', desc: '透過平台填寫寵物體型、品種、服務項目與偏好造型，系統即時確認檔期。' },
  { step: '02', title: '到店確認', desc: '到店後美容師會先進行毛髮與皮膚狀況評估，並與您確認最終造型方向。' },
  { step: '03', title: '開始美容', desc: '全程以低壓方式進行，確保您的毛寶貝不受到不必要的壓力。' },
  { step: '04', title: '成果回報', desc: '完成後提供前後對比照片，並透過系統即時推播給您，安心等候即可。' },
];

const NOTES = [
  '美容前 4 小時請勿餵食，避免暈眩。',
  '請確保疫苗接種記錄在有效期內（狂犬病、八合一）。',
  '若寵物有皮膚病、耳道感染等，請提前告知美容師。',
  '特殊品種（貴賓、雪納瑞、比熊等）價格可能依毛量調整。',
  '請在預約時間前 15 分鐘到店辦理。',
];

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function GroomingDetailPage() {
  return (
    <DocLayout
      breadcrumbs={[{ label: '服務介紹' }, { label: '寵物美容沙龍' }]}
      title="寵物美容沙龍"
      subtitle="由國際認證美容師提供的全套洗護服務，從基礎清潔到頂級 SPA，讓您的毛寶貝煥然一新。"
      accentColor="amber"
    >
      {/* Intro card */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 rounded-3xl p-8 mb-12 flex gap-6 items-start">
        <div className="text-5xl shrink-0">✂️</div>
        <div>
          <h2 className="text-xl font-black text-stone-900 mb-2">專業美容・溫柔陪伴</h2>
          <p className="text-stone-600 leading-relaxed">
            毛星球美容沙龍的每一位美容師均持有 <span className="font-bold text-amber-700">NDGAA 國際認證</span> 或台灣寵物美容協會（TPGA）認可資格。
            我們採用低壓、友善的美容方式，不強迫、不束縛，讓每隻毛寶貝在舒適的環境中完成造型。
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            {['NDGAA 認證', 'TPGA 認可', '低壓美容', '有機護毛品'].map(tag => (
              <span key={tag} className="bg-white border border-amber-200 text-amber-700 text-xs font-bold px-3 py-1.5 rounded-full">
                ✓ {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Service packages */}
      <section className="mb-14">
        <h2 className="text-2xl font-black text-stone-900 mb-2">服務方案</h2>
        <p className="text-stone-500 mb-8">依照您的需求選擇最合適的美容方案，所有方案皆含基礎清潔與到店評估。</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PACKAGES.map((pkg) => (
            <div
              key={pkg.name}
              className={`relative border-2 ${pkg.color} rounded-2xl overflow-hidden flex flex-col ${pkg.popular ? 'ring-2 ring-amber-400 ring-offset-2' : ''}`}
            >
              {pkg.popular && (
                <div className="absolute top-4 right-4 bg-amber-400 text-stone-900 text-xs font-black px-3 py-1 rounded-full">
                  最受歡迎
                </div>
              )}
              <div className={`${pkg.headerBg} p-6`}>
                <h3 className="text-lg font-black text-white">{pkg.name}</h3>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-white">{pkg.price}</span>
                </div>
                <div className="flex items-center gap-1.5 mt-2 text-white/70 text-xs">
                  <Clock className="w-3.5 h-3.5" />
                  {pkg.duration}
                </div>
              </div>
              <div className="p-6 flex flex-col flex-1 bg-white">
                <ul className="space-y-2.5 flex-1">
                  {pkg.features.map(f => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-stone-600">
                      <Check className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/login"
                  className="mt-6 w-full py-3 rounded-xl font-bold text-sm text-center bg-gradient-to-r from-amber-400 to-orange-500 text-white hover:-translate-y-0.5 hover:shadow-lg hover:shadow-orange-200 transition-all duration-200 block"
                >
                  立即預約
                </Link>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-stone-400 mt-4">* 以上價格以小型犬/貓為基準，大型犬依體型與毛量另計。</p>
      </section>

      {/* Process steps */}
      <section className="mb-14">
        <h2 className="text-2xl font-black text-stone-900 mb-8">美容流程</h2>
        <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true }} className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {STEPS.map(s => (
            <motion.div key={s.step} variants={item} className="bg-white border border-stone-100 rounded-2xl p-6 flex gap-4 shadow-sm">
              <div className="w-12 h-12 shrink-0 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center">
                <span className="text-white font-black text-lg">{s.step}</span>
              </div>
              <div>
                <h3 className="font-black text-stone-900">{s.title}</h3>
                <p className="text-sm text-stone-500 mt-1 leading-relaxed">{s.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Notes */}
      <section className="mb-14">
        <h2 className="text-2xl font-black text-stone-900 mb-6">美容前注意事項</h2>
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-7 space-y-3">
          {NOTES.map((note, i) => (
            <div key={i} className="flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <span className="text-sm text-stone-700">{note}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Stylists highlight */}
      <section className="mb-14">
        <h2 className="text-2xl font-black text-stone-900 mb-6">美容師團隊</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { name: '林美容師', role: 'NDGAA 認證・10 年經驗', specialty: '貴賓、比熊造型', emoji: '👩' },
            { name: '陳師傅', role: 'TPGA 高級・8 年經驗', specialty: '大型犬、雪橇犬類', emoji: '🧑' },
            { name: '王師傅', role: 'NDGAA 認證・6 年經驗', specialty: '貓咪、短毛品種', emoji: '👱' },
          ].map(stylist => (
            <div key={stylist.name} className="bg-white border border-stone-100 rounded-2xl p-6 text-center shadow-sm hover:shadow-md transition-shadow">
              <div className="text-5xl mb-4">{stylist.emoji}</div>
              <div className="font-black text-stone-900">{stylist.name}</div>
              <div className="text-xs text-amber-600 font-bold mt-1">{stylist.role}</div>
              <div className="text-xs text-stone-400 mt-2">擅長：{stylist.specialty}</div>
              <div className="flex justify-center gap-1 mt-3">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star key={j} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <div className="bg-gradient-to-br from-stone-900 to-stone-800 rounded-3xl p-10 text-center">
        <div className="text-4xl mb-4">✂️</div>
        <h3 className="text-2xl font-black text-white mb-3">準備好讓毛寶貝煥然一新了嗎？</h3>
        <p className="text-stone-400 mb-8">現在註冊，首次預約享有 95 折優惠！</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/register" className="flex items-center justify-center gap-2 bg-gradient-to-r from-amber-400 to-orange-500 text-white px-8 py-3.5 rounded-xl font-bold shadow-lg shadow-orange-500/30 hover:-translate-y-0.5 transition-all duration-200">
            免費註冊立即預約 <ArrowRight className="w-4 h-4" />
          </Link>
          <Link to="/login" className="flex items-center justify-center gap-2 bg-white/10 border border-white/20 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-white/20 transition-all duration-200">
            已有帳號？登入
          </Link>
        </div>
      </div>
    </DocLayout>
  );
}

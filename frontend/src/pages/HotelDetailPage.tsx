import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Check, ArrowRight, Camera, Shield, Clock, Wifi, Wind, Coffee } from 'lucide-react';
import DocLayout from '../components/layout/DocLayout';

const ROOM_TYPES = [
  {
    name: '標準艙',
    size: '約 3 坪',
    price: 'NT$ 1,200 / 晚',
    emoji: '🛏️',
    color: 'border-stone-200',
    headerBg: 'bg-stone-700',
    features: ['獨立空調控溫', '舒適寢具與玩具', '每日 3 次餵食', '每日健康日誌', '入住照片推播'],
    suitable: '適合中小型犬貓',
  },
  {
    name: '豪華雙床房',
    size: '約 5 坪',
    price: 'NT$ 1,800 / 晚',
    emoji: '🏨',
    color: 'border-teal-300',
    headerBg: 'bg-gradient-to-br from-teal-500 to-emerald-600',
    popular: true,
    features: ['標準艙全部包含', '加大活動空間', '電視娛樂系統', '每日戶外散步 2 次', '即時照片推播 3 次 / 日', '入住歡迎禮包'],
    suitable: '適合各型犬貓',
  },
  {
    name: 'VIP 總統套房',
    size: '約 8 坪',
    price: 'NT$ 3,200 / 晚',
    emoji: '👑',
    color: 'border-amber-300',
    headerBg: 'bg-gradient-to-br from-amber-500 to-orange-500',
    features: ['豪華雙床房全部包含', 'VIP 專屬照護員配對', '24hr 視訊陪護', '每日 SPA 按摩', '客製化菜單', '入住/退房接送服務', '精品離開伴手禮'],
    suitable: '適合所有毛寶貝的皇家享受',
  },
];

const AMENITIES = [
  { icon: Camera, label: '24h 高清監控', desc: '每間房配有全覆蓋監控，飼主可於 App 即時查看。' },
  { icon: Wind, label: '獨立空調', desc: '每間客房均配置獨立空調，四季恆溫 22-26°C。' },
  { icon: Shield, label: '疫苗合規審查', desc: '所有入住寵物需提供在有效期內的疫苗證明，保障群體健康。' },
  { icon: Wifi, label: '線上健康日誌', desc: '每日餵食、排泄、活動狀況均記錄並同步至 App。' },
  { icon: Clock, label: '全天候人員陪護', desc: '夜班也有值班人員常駐，寵物不獨處超過 2 小時。' },
  { icon: Coffee, label: '客製化菜單', desc: '支援特殊飲食需求（過敏、低鈉、處方飼料）。' },
];

const CHECK_ITEMS = [
  '疫苗接種本（有效期內）',
  '狂犬病疫苗證明',
  '常用飼料（建議 3 天份以上）',
  '寵物喜愛的玩具或安撫物',
  '若有用藥，請附上說明與醫師指示',
  '緊急聯絡人電話',
];

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function HotelDetailPage() {
  return (
    <DocLayout
      breadcrumbs={[{ label: '服務介紹' }, { label: '寵物精品旅館' }]}
      title="寵物精品旅館"
      subtitle="獨立套房、24 小時監控與人員陪護。不論是商旅出差還是旅遊度假，都讓您的寵物安心放假。"
      accentColor="teal"
    >
      {/* Intro */}
      <div className="bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-100 rounded-3xl p-8 mb-12 flex gap-6 items-start">
        <div className="text-5xl shrink-0">🏨</div>
        <div>
          <h2 className="text-xl font-black text-stone-900 mb-2">不只是寄放，是一場專屬假期</h2>
          <p className="text-stone-600 leading-relaxed">
            毛星球精品旅館提供寵物獨立客房、全天候人員陪護與即時照片回傳。
            我們嚴格執行 <span className="font-bold text-teal-700">疫苗合規入住政策</span>，確保每位住客都在乾淨、安全的環境中度過每一晚。
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            {['24h 人員常駐', '高清即時監控', '疫苗合規保障', '個人化照護'].map(tag => (
              <span key={tag} className="bg-white border border-teal-200 text-teal-700 text-xs font-bold px-3 py-1.5 rounded-full">
                ✓ {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Room types */}
      <section className="mb-14">
        <h2 className="text-2xl font-black text-stone-900 mb-2">房型介紹</h2>
        <p className="text-stone-500 mb-8">依您的寵物體型與喜好，選擇最適合的住宿方案。</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {ROOM_TYPES.map((room) => (
            <div
              key={room.name}
              className={`relative border-2 ${room.color} rounded-2xl overflow-hidden flex flex-col ${room.popular ? 'ring-2 ring-teal-400 ring-offset-2' : ''}`}
            >
              {room.popular && (
                <div className="absolute top-4 right-4 bg-teal-400 text-white text-xs font-black px-3 py-1 rounded-full">
                  最受歡迎
                </div>
              )}
              <div className={`${room.headerBg} p-6`}>
                <div className="text-3xl mb-3">{room.emoji}</div>
                <h3 className="text-lg font-black text-white">{room.name}</h3>
                <div className="text-white/70 text-sm mt-1">{room.size}</div>
                <div className="mt-3 text-3xl font-black text-white">{room.price}</div>
              </div>
              <div className="p-6 flex flex-col flex-1 bg-white">
                <div className="text-xs font-bold text-stone-400 mb-3 uppercase">{room.suitable}</div>
                <ul className="space-y-2.5 flex-1">
                  {room.features.map(f => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-stone-600">
                      <Check className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/login"
                  className="mt-6 w-full py-3 rounded-xl font-bold text-sm text-center bg-gradient-to-r from-teal-400 to-emerald-500 text-white hover:-translate-y-0.5 hover:shadow-lg hover:shadow-teal-200 transition-all duration-200 block"
                >
                  查看空房並預訂
                </Link>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-stone-400 mt-4">* 價格以單隻寵物計算，超過 2 隻同房入住享 9 折優惠。長住（7 晚以上）享 85 折。</p>
      </section>

      {/* Amenities */}
      <section className="mb-14">
        <h2 className="text-2xl font-black text-stone-900 mb-8">旅館設施與服務</h2>
        <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {AMENITIES.map((a) => (
            <motion.div key={a.label} variants={item} className="bg-white border border-stone-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-11 h-11 bg-teal-50 border border-teal-100 rounded-xl flex items-center justify-center mb-4">
                <a.icon className="w-5 h-5 text-teal-500" />
              </div>
              <h3 className="font-black text-stone-900 mb-1">{a.label}</h3>
              <p className="text-sm text-stone-500 leading-relaxed">{a.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Check-in list */}
      <section className="mb-14">
        <h2 className="text-2xl font-black text-stone-900 mb-6">入住攜帶物品清單</h2>
        <div className="bg-teal-50 border border-teal-100 rounded-2xl p-7">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {CHECK_ITEMS.map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-md border-2 border-teal-400 bg-teal-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-white" />
                </div>
                <span className="text-sm text-stone-700">{item}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-stone-400 mt-6">⚠️ 未攜帶有效疫苗證明者，依規定將無法辦理入住手續，敬請見諒。</p>
        </div>
      </section>

      {/* Timeline / Check-in process */}
      <section className="mb-14">
        <h2 className="text-2xl font-black text-stone-900 mb-6">入住時間與流程</h2>
        <div className="bg-white border border-stone-100 rounded-2xl overflow-hidden shadow-sm">
          {[
            { time: '12:00 以後', label: '開始辦理入住 (Check-in)' },
            { time: '每日 08:00', label: '早餐餵食 & 健康日誌更新' },
            { time: '每日 12:00', label: '午餐 & 戶外活動（豪華房以上）' },
            { time: '每日 18:00', label: '晚餐 & 每日照片推播' },
            { time: '10:00 以前', label: '退房時間 (Check-out)，逾時加收半日費用' },
          ].map((row, i) => (
            <div key={i} className={`flex items-center gap-5 px-7 py-4 ${i % 2 === 0 ? 'bg-stone-50' : 'bg-white'}`}>
              <div className="w-24 shrink-0 text-sm font-black text-teal-600">{row.time}</div>
              <div className="w-px h-6 bg-stone-200 shrink-0" />
              <div className="text-sm text-stone-700">{row.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <div className="bg-gradient-to-br from-stone-900 to-stone-800 rounded-3xl p-10 text-center">
        <div className="text-4xl mb-4">🏨</div>
        <h3 className="text-2xl font-black text-white mb-3">讓毛寶貝也有個舒適的假期</h3>
        <p className="text-stone-400 mb-8">立即查看可用房型，為您的出遊計畫預先安排。</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/register" className="flex items-center justify-center gap-2 bg-gradient-to-r from-teal-400 to-emerald-500 text-white px-8 py-3.5 rounded-xl font-bold shadow-lg shadow-teal-500/30 hover:-translate-y-0.5 transition-all duration-200">
            免費註冊並預訂房型 <ArrowRight className="w-4 h-4" />
          </Link>
          <Link to="/login" className="flex items-center justify-center gap-2 bg-white/10 border border-white/20 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-white/20 transition-all duration-200">
            已有帳號？登入
          </Link>
        </div>
      </div>
    </DocLayout>
  );
}

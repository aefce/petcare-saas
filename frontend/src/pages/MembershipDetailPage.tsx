import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Check, X, ArrowRight, Star, Crown, Zap } from 'lucide-react';
import DocLayout from '../components/layout/DocLayout';

const COMPARISON = [
  { feature: '線上預約功能', guest: true, member: true, vip: true },
  { feature: '寵物健康日誌查看', guest: true, member: true, vip: true },
  { feature: '美容服務預約', guest: false, member: true, vip: true },
  { feature: '旅館優先排程', guest: false, member: false, vip: true },
  { feature: '美容服務折扣', guest: false, member: '95 折', vip: '85 折' },
  { feature: '旅館住宿折扣', guest: false, member: false, vip: '9 折' },
  { feature: '專屬照護員配對', guest: false, member: false, vip: true },
  { feature: '免費健康諮詢（次/月）', guest: '0 次', member: '1 次', vip: '3 次' },
  { feature: '疫苗到期提醒', guest: false, member: true, vip: true },
  { feature: '生日驚喜禮', guest: false, member: false, vip: true },
  { feature: '24h 緊急聯絡窗口', guest: false, member: false, vip: true },
  { feature: '帳號有效期', guest: '30 天', member: '無限期', vip: '無限期' },
];

const PLANS = [
  {
    name: '訪客帳號',
    price: '免費',
    period: '30 天效期',
    icon: Zap,
    color: 'border-stone-200',
    headerBg: 'bg-stone-600',
    accentColor: 'text-stone-500',
    desc: '提供給希望先試用平台的訪客，30 天內可查看服務內容與健康日誌。',
    cta: '免費取得',
    ctaHref: '/register',
    ctaStyle: 'bg-stone-700 text-white hover:bg-stone-800',
  },
  {
    name: '一般會員',
    price: '免費',
    period: '無限期',
    icon: Star,
    color: 'border-amber-300',
    headerBg: 'bg-gradient-to-br from-amber-500 to-orange-500',
    accentColor: 'text-amber-600',
    popular: true,
    desc: '完整功能的標準帳號，享有預約服務與日誌查看等所有核心功能。',
    cta: '立即免費加入',
    ctaHref: '/register',
    ctaStyle: 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-lg shadow-orange-200',
  },
  {
    name: '年度 VIP 會員',
    price: 'NT$ 8,800',
    period: '每年',
    icon: Crown,
    color: 'border-violet-300',
    headerBg: 'bg-gradient-to-br from-violet-500 to-purple-600',
    accentColor: 'text-violet-600',
    desc: '頂級會員專屬方案，享有最大折扣、專屬照護員配對與全年優先服務。',
    cta: '升級 VIP',
    ctaHref: '/register',
    ctaStyle: 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg shadow-purple-200',
  },
];

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

function FeatureCell({ value }: { value: boolean | string }) {
  if (value === true) return <Check className="w-5 h-5 text-emerald-500 mx-auto" />;
  if (value === false) return <X className="w-4 h-4 text-stone-300 mx-auto" />;
  return <span className="text-sm font-bold text-amber-600">{value}</span>;
}

export default function MembershipDetailPage() {
  return (
    <DocLayout
      breadcrumbs={[{ label: '其他資訊' }, { label: '會員方案說明' }]}
      title="會員方案說明"
      subtitle="了解毛星球的三種帳號類型，選擇最適合您與毛寶貝的方案。所有帳號均完全免費申請。"
      accentColor="amber"
    >
      {/* Plan cards */}
      <section className="mb-14">
        <h2 className="text-2xl font-black text-stone-900 mb-8">方案選擇</h2>
        <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true }} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((plan) => {
            const Icon = plan.icon;
            return (
              <motion.div
                key={plan.name}
                variants={item}
                className={`relative border-2 ${plan.color} rounded-2xl overflow-hidden flex flex-col ${plan.popular ? 'ring-2 ring-amber-400 ring-offset-2' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute top-4 right-4 bg-amber-400 text-stone-900 text-xs font-black px-3 py-1 rounded-full">
                    推薦
                  </div>
                )}
                <div className={`${plan.headerBg} p-6`}>
                  <Icon className="w-8 h-8 text-white/80 mb-3" />
                  <h3 className="text-lg font-black text-white">{plan.name}</h3>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-3xl font-black text-white">{plan.price}</span>
                    <span className="text-white/60 text-sm">/ {plan.period}</span>
                  </div>
                </div>
                <div className="p-6 flex flex-col flex-1 bg-white">
                  <p className="text-sm text-stone-500 leading-relaxed mb-6">{plan.desc}</p>
                  <div className="mt-auto">
                    <Link
                      to={plan.ctaHref}
                      className={`w-full py-3 rounded-xl font-bold text-sm text-center hover:-translate-y-0.5 transition-all duration-200 block ${plan.ctaStyle}`}
                    >
                      {plan.cta}
                    </Link>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* Comparison table */}
      <section className="mb-14">
        <h2 className="text-2xl font-black text-stone-900 mb-2">功能對比表</h2>
        <p className="text-stone-500 mb-6">詳細了解每種方案所包含的功能差異。</p>
        <div className="bg-white border border-stone-100 rounded-2xl overflow-hidden shadow-sm">
          {/* Table header */}
          <div className="grid grid-cols-4 bg-stone-50 border-b border-stone-100">
            <div className="px-5 py-4 text-sm font-black text-stone-500">功能</div>
            <div className="px-3 py-4 text-sm font-black text-center text-stone-600">訪客</div>
            <div className="px-3 py-4 text-sm font-black text-center text-amber-600">一般會員</div>
            <div className="px-3 py-4 text-sm font-black text-center text-violet-600">VIP 會員</div>
          </div>
          {COMPARISON.map((row, i) => (
            <div key={row.feature} className={`grid grid-cols-4 border-b border-stone-50 items-center ${i % 2 === 0 ? 'bg-white' : 'bg-stone-50/50'}`}>
              <div className="px-5 py-3.5 text-sm text-stone-700">{row.feature}</div>
              <div className="px-3 py-3.5 text-center">
                <FeatureCell value={row.guest} />
              </div>
              <div className="px-3 py-3.5 text-center">
                <FeatureCell value={row.member} />
              </div>
              <div className="px-3 py-3.5 text-center">
                <FeatureCell value={row.vip} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* VIP highlight */}
      <section className="mb-14">
        <h2 className="text-2xl font-black text-stone-900 mb-6">VIP 會員專屬特權說明</h2>
        <div className="space-y-4">
          {[
            {
              title: '旅館優先預訂',
              desc: '每年旺季（春節、連假）旅館房位往往提前 2-3 週售罄。VIP 會員可在一般開放預訂前 48 小時優先鎖定房型，避免向隅。',
            },
            {
              title: '專屬照護員配對',
              desc: '根據您的寵物品種、個性與照護需求，系統為您配對最合適的照護員，每次住宿均由同一組照護員服務，降低適應壓力。',
            },
            {
              title: '折扣說明',
              desc: '美容服務 85 折、旅館住宿 9 折，以當次訂單實際金額計算，不與其他優惠合併使用。年度節慶優惠另行公告。',
            },
            {
              title: '生日驚喜禮',
              desc: '根據您寵物的生日（系統記錄），在生日當週提供客製化驚喜禮包，包含毛寶貝喜愛的零食、玩具與生日卡片。',
            },
          ].map((item) => (
            <div key={item.title} className="bg-white border border-stone-100 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="w-4 h-4 text-violet-500" />
                <h3 className="font-black text-stone-900">{item.title}</h3>
              </div>
              <p className="text-sm text-stone-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Contract terms */}
      <section className="mb-14">
        <h2 className="text-2xl font-black text-stone-900 mb-6">訂閱說明與退款規則</h2>
        <div className="bg-stone-50 border border-stone-200 rounded-2xl p-7 space-y-4">
          {[
            'VIP 年度方案以 12 個月為一期，一次性收費 NT$ 8,800，不可中途退訂。',
            '訂閱到期後，若未續訂，帳號自動降級為「一般會員」，原有資料與服務日誌保留。',
            '訂閱費用包含增值稅（含於定價中），不額外收取服務費。',
            '若因系統故障導致服務中斷超過 72 小時，可申請比例退款（按日計算）。',
            '如需發票，請於付款後 7 日內聯絡客服，系統將補寄電子發票至您的信箱。',
          ].map((term, i) => (
            <div key={i} className="flex gap-3 items-start">
              <div className="w-5 h-5 shrink-0 rounded-full bg-stone-300 text-white flex items-center justify-center text-xs font-black mt-0.5">
                {i + 1}
              </div>
              <p className="text-sm text-stone-600 leading-relaxed">{term}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <div className="bg-gradient-to-br from-stone-900 to-stone-800 rounded-3xl p-10 text-center">
        <div className="text-4xl mb-4">🌟</div>
        <h3 className="text-2xl font-black text-white mb-3">立即加入，免費體驗完整服務</h3>
        <p className="text-stone-400 mb-8">一般會員完全免費，不需信用卡，30 秒完成註冊。</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/register" className="flex items-center justify-center gap-2 bg-gradient-to-r from-amber-400 to-orange-500 text-white px-8 py-3.5 rounded-xl font-bold shadow-lg shadow-orange-500/30 hover:-translate-y-0.5 transition-all duration-200">
            免費創建帳號 <ArrowRight className="w-4 h-4" />
          </Link>
          <Link to="/faq" className="flex items-center justify-center gap-2 bg-white/10 border border-white/20 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-white/20 transition-all duration-200">
            查看常見問題
          </Link>
        </div>
      </div>
    </DocLayout>
  );
}

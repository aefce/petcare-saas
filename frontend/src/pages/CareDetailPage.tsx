import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Heart, Camera, Activity, Moon, Sun, Sunset, AlertTriangle } from 'lucide-react';
import DocLayout from '../components/layout/DocLayout';

const DAILY_SCHEDULE = [
  { time: '07:00', icon: Sun, label: '起床 & 早晨檢查', desc: '照護員確認每隻寵物的精神與體況，記錄排泄狀況。' },
  { time: '08:00', icon: null, label: '早餐餵食', desc: '按照飼主指定的飼料品牌與份量提供，搭配新鮮飲用水。' },
  { time: '09:30', icon: Activity, label: '戶外活動時段', desc: '帶至庭院進行散步或玩耍，促進肌肉活動與心理刺激。' },
  { time: '12:00', icon: null, label: '午餐 & 休息', desc: '提供午餐後讓寵物進行午休，保持充足睡眠。' },
  { time: '15:00', icon: null, label: '互動玩耍時段', desc: '照護員進行個別互動，包含玩具遊戲或撫摸陪伴。' },
  { time: '17:00', icon: null, label: '傍晚健康日誌', desc: '記錄今日飲食、排泄、活動量，並拍照上傳至系統。' },
  { time: '18:00', icon: Sunset, label: '晚餐餵食', desc: '提供晚餐，飯後確認環境整潔，補換清潔寢具。' },
  { time: '21:00', icon: Moon, label: '就寢準備', desc: '熄燈，值班人員持續巡視，確保每位住客安靜休息。' },
];

const MONITORING_ITEMS = [
  { label: '食慾與飲水量', icon: '🍽️', desc: '每餐均記錄進食份量，異常立即通報飼主。' },
  { label: '排泄狀況', icon: '📋', desc: '記錄頻率與形態，異常狀況提前預警。' },
  { label: '活動力', icon: '🏃', desc: '比較日常基線，觀察是否有精神不振跡象。' },
  { label: '毛髮與皮膚', icon: '🔍', desc: '定期檢查是否有脫毛、紅疹或寄生蟲跡象。' },
  { label: '體溫與呼吸', icon: '🌡️', desc: '高溫季節每日量測，低溫季節確認保暖措施。' },
  { label: '情緒狀態', icon: '😊', desc: '記錄是否有分離焦慮或異常行為，必要時安撫陪伴。' },
];

const EMERGENCY_STEPS = [
  '值班照護員發現異常狀況（食慾不振、嘔吐、呼吸困難等）',
  '立即電話通知飼主，說明症狀與可能原因',
  '經飼主同意，由工作人員送至合作獸醫院就診',
  '全程協助陪診，並於回館後持續觀察',
  '將就診紀錄、診斷報告上傳至系統，供飼主查閱',
];

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const anim = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function CareDetailPage() {
  return (
    <DocLayout
      breadcrumbs={[{ label: '服務介紹' }, { label: '日常健康照護' }]}
      title="日常健康照護"
      subtitle="專業照護員以科學化的方式追蹤每隻寵物的健康指標，讓您在遠端也能掌握毛寶貝的每一個時刻。"
      accentColor="rose"
    >
      {/* Intro */}
      <div className="bg-gradient-to-br from-rose-50 to-pink-50 border border-rose-100 rounded-3xl p-8 mb-12 flex gap-6 items-start">
        <div className="text-5xl shrink-0">🩺</div>
        <div>
          <h2 className="text-xl font-black text-stone-900 mb-2">以數據驅動的照護方式</h2>
          <p className="text-stone-600 leading-relaxed">
            我們的照護系統不只是「餵食和陪伴」。每位照護員均接受過動物行為學培訓，能夠識別細微的健康異常信號。
            所有觀察結果透過系統整合為 <span className="font-bold text-rose-700">每日健康日誌</span>，即時同步至您的手機。
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            {['行為學培訓', '每日數位日誌', '照片 & 影片回報', '合作獸醫院'].map(tag => (
              <span key={tag} className="bg-white border border-rose-200 text-rose-700 text-xs font-bold px-3 py-1.5 rounded-full">
                ✓ {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Daily schedule */}
      <section className="mb-14">
        <h2 className="text-2xl font-black text-stone-900 mb-2">一天的作息安排</h2>
        <p className="text-stone-500 mb-8">所有入住寵物均依照以下標準作息表進行日常照護。</p>
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[4.5rem] top-4 bottom-4 w-px bg-rose-100 hidden sm:block" />
          <div className="space-y-4">
            {DAILY_SCHEDULE.map((row, i) => (
              <motion.div
                key={row.time}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="flex gap-5 items-start"
              >
                <div className="shrink-0 w-20 text-right">
                  <span className="text-sm font-black text-rose-500">{row.time}</span>
                </div>
                <div className="relative bg-white border border-stone-100 rounded-2xl p-5 flex-1 shadow-sm">
                  <div className="absolute left-[-9px] top-5 w-4 h-4 bg-rose-100 border-2 border-rose-300 rounded-full hidden sm:block" />
                  <div className="font-black text-stone-900 mb-1">{row.label}</div>
                  <div className="text-sm text-stone-500 leading-relaxed">{row.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Health monitoring */}
      <section className="mb-14">
        <h2 className="text-2xl font-black text-stone-900 mb-2">健康監測項目</h2>
        <p className="text-stone-500 mb-8">每日系統性記錄以下健康指標，建立您的寵物個人健康檔案。</p>
        <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {MONITORING_ITEMS.map((m) => (
            <motion.div key={m.label} variants={anim} className="bg-white border border-stone-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="text-3xl mb-3">{m.icon}</div>
              <h3 className="font-black text-stone-900 mb-1">{m.label}</h3>
              <p className="text-sm text-stone-500 leading-relaxed">{m.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Photo/video reporting */}
      <section className="mb-14">
        <h2 className="text-2xl font-black text-stone-900 mb-6">即時照片 & 影片同步</h2>
        <div className="bg-white border border-stone-100 rounded-2xl p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-8 items-center">
            <div className="w-20 h-20 bg-rose-50 rounded-2xl flex items-center justify-center shrink-0">
              <Camera className="w-10 h-10 text-rose-500" />
            </div>
            <div>
              <h3 className="text-xl font-black text-stone-900 mb-3">讓您在遠端也能看到毛寶貝</h3>
              <p className="text-stone-500 leading-relaxed mb-4">
                每日固定推播時段（早晨、傍晚），照護員拍攝寵物當下狀態的照片或短影片，上傳至您的個人 App 帳戶。
                若發現特別可愛的瞬間，也會額外推播讓您會心一笑。
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: '早晨推播', time: '08:30' },
                  { label: '活動推播', time: '10:30' },
                  { label: '傍晚推播', time: '17:30' },
                  { label: '特別瞬間', time: '不定時' },
                ].map(p => (
                  <div key={p.label} className="bg-rose-50 border border-rose-100 rounded-xl p-3 text-center">
                    <div className="text-xs text-rose-500 font-bold">{p.label}</div>
                    <div className="text-sm font-black text-stone-800 mt-1">{p.time}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Emergency procedure */}
      <section className="mb-14">
        <h2 className="text-2xl font-black text-stone-900 mb-6">緊急醫療處理流程</h2>
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-7">
          <div className="flex items-center gap-2 mb-5">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <span className="font-black text-amber-700">緊急狀況處理 SOP</span>
          </div>
          <div className="space-y-4">
            {EMERGENCY_STEPS.map((step, i) => (
              <div key={i} className="flex gap-4 items-start">
                <div className="w-7 h-7 shrink-0 bg-amber-500 text-white rounded-full flex items-center justify-center text-sm font-black">
                  {i + 1}
                </div>
                <p className="text-sm text-stone-700 leading-relaxed pt-0.5">{step}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 p-4 bg-white rounded-xl border border-amber-200">
            <p className="text-xs text-stone-500">
              🏥 毛星球與台北市多家動物醫院建立合作關係，緊急狀況下可直接轉診至合作院所，全程陪同就診。
              所有急診費用由飼主承擔，工作人員在場協助溝通但不代為簽署醫療同意書。
            </p>
          </div>
        </div>
      </section>

      {/* Staff qualifications */}
      <section className="mb-14">
        <h2 className="text-2xl font-black text-stone-900 mb-6">照護員資格要求</h2>
        <div className="bg-white border border-stone-100 rounded-2xl overflow-hidden shadow-sm">
          {[
            { label: '動物行為學基礎訓練', detail: '入職前須完成 40 小時的動物行為學培訓課程' },
            { label: '急救知識', detail: '具備寵物急救基本知識，包含 CPR 操作' },
            { label: '疾病識別能力', detail: '能識別常見疾病徵兆（腸胃炎、過敏、骨折等）' },
            { label: '每半年在職訓練', detail: '定期更新照護知識，追蹤動物醫學最新進展' },
          ].map((item, i) => (
            <div key={i} className={`flex items-start gap-5 px-7 py-5 ${i % 2 === 0 ? 'bg-stone-50' : 'bg-white'}`}>
              <Heart className="w-4 h-4 text-rose-400 shrink-0 mt-1" />
              <div>
                <div className="font-bold text-stone-900 text-sm">{item.label}</div>
                <div className="text-xs text-stone-500 mt-0.5">{item.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <div className="bg-gradient-to-br from-stone-900 to-stone-800 rounded-3xl p-10 text-center">
        <div className="text-4xl mb-4">🩺</div>
        <h3 className="text-2xl font-black text-white mb-3">放心出行，毛寶貝有我們守護</h3>
        <p className="text-stone-400 mb-8">立即加入毛星球，開始為您的寵物建立健康檔案。</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/register" className="flex items-center justify-center gap-2 bg-gradient-to-r from-rose-400 to-pink-500 text-white px-8 py-3.5 rounded-xl font-bold shadow-lg shadow-rose-500/30 hover:-translate-y-0.5 transition-all duration-200">
            立即免費加入 <ArrowRight className="w-4 h-4" />
          </Link>
          <Link to="/faq" className="flex items-center justify-center gap-2 bg-white/10 border border-white/20 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-white/20 transition-all duration-200">
            查看常見問題
          </Link>
        </div>
      </div>
    </DocLayout>
  );
}

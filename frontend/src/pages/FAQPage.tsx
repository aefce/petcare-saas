import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { HelpCircle, ChevronDown, ChevronUp, Search, MessageSquare } from 'lucide-react';
import DocLayout from '../components/layout/DocLayout';

const FAQS = [
  {
    category: '預約與流程',
    items: [
      {
        q: '如何線上預約美容或旅館服務？',
        a: '您需要先註冊並登入毛星球帳號。登入後，在儀表板點擊「我的預約」或「精品旅館」，填寫您的寵物資訊、選擇想要的日期與房型/服務方案，即可送出預約申請。美容預約會即時確認，旅館預約則需等待疫苗審核通過後確認。',
      },
      {
        q: '預約後可以取消或更改時間嗎？',
        a: '可以的。在服務開始前 24 小時內，您可以透過儀表板自主取消或修改預約，不收取任何費用。若是旅館住宿預約，建議於入住前 3 天取消，以便釋出房位；24 小時內取消將扣除當日住宿 50% 訂金。',
      },
      {
        q: '訪客帳號（臨時註冊）與一般會員有什麼區別？',
        a: '訪客帳號是為了提供臨時查看功能，效期為 30 天，30 天後該帳戶將失效。訪客帳戶僅能查看寵物進度與歷史日誌，無法進行美容、旅館預約等操作。一般會員則是永久有效，享有完整的預約與管理權限。',
      },
    ],
  },
  {
    category: '健康與安全 (疫苗合規)',
    items: [
      {
        q: '為什麼入住旅館一定要強制驗證疫苗？',
        a: '為確保整體環境的安全性，避免傳染病傳播（如犬瘟熱、貓瘟等），我們實施嚴格的疫苗合規驗證制度。所有入住寵物均須於 App 上傳有效期內的疫苗接種證明書（需包含狂犬病疫苗及八合一/三合一疫苗），經工作人員審核通過後才可正式辦理入住。',
      },
      {
        q: '疫苗證明的審核需要多久時間？',
        a: '我們的行政團隊會在收到上傳證明的 4 小時內（工作時間 08:00 – 20:00）完成審核。審核通過後您會收到系統推播通知；若被退件，我們也會說明原因（如照片模糊、過期等）並請您重新上傳。',
      },
      {
        q: '如果我的寵物因身體原因無法打疫苗怎麼辦？',
        a: '若寵物因年齡過小（小於 3 個月）、懷孕或患有特殊疾病經獸醫診斷不適宜接種疫苗，請提供合格獸醫院開立之「不適宜接種診斷證明書」。我們將評估是否能安排在獨立隔離房（VIP套房）入住，以確保安全。',
      },
    ],
  },
  {
    category: '美容與照護',
    items: [
      {
        q: '美容服務過程中，我能看到寵物的狀態嗎？',
        a: '可以。美容師在美容前、美容中、美容後均會拍攝照片記錄，並上傳至系統。您可以隨時在您的 Dashboard 查看「美容進度日誌」與照片，讓您更放心。',
      },
      {
        q: '寵物有分離焦慮，你們會怎麼處理？',
        a: '我們的照護員皆受過動物行為學訓練。對於有分離焦慮的毛寶貝，我們會先安排在安靜區域，並由專屬照護員提供撫摸與玩具陪伴。若是 VIP 住客，照護員會提供更密集的陪伴與客製化安撫方案。',
      },
      {
        q: '如果寵物在入住期間生病了，如何處理？',
        a: '若寵物出現異常症狀（如嘔吐、拉肚子、發燒等），值班人員會第一時間撥打電話通知您。經您同意後，工作人員會立即護送寵物至合作獸醫院就診，並將診斷報告與處方單同步上傳至系統。急診費用依實際支出由飼主承擔。',
      },
    ],
  },
];

function AccordionItem({ q, a }: { q: string; a: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-stone-100 last:border-b-0 py-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left font-black text-stone-800 hover:text-orange-500 transition-colors py-2"
      >
        <span className="text-base">{q}</span>
        {isOpen ? <ChevronUp className="w-5 h-5 text-orange-500" /> : <ChevronDown className="w-5 h-5 text-stone-400" />}
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <p className="text-sm text-stone-500 leading-relaxed mt-2 pb-2 pl-1 whitespace-pre-line">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFaqs = FAQS.map(cat => {
    const matchedItems = cat.items.filter(
      item =>
        item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.a.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return { ...cat, items: matchedItems };
  }).filter(cat => cat.items.length > 0);

  return (
    <DocLayout
      breadcrumbs={[{ label: '其他資訊' }, { label: '常見問題 FAQ' }]}
      title="常見問題 FAQ"
      subtitle="這裡整理了飼主最常詢問的關於預約、疫苗審查、照護細節等問題。如果仍有疑問，隨時與我們的客服小組聯繫。"
      accentColor="purple"
    >
      {/* Search Bar */}
      <div className="relative mb-10">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="搜尋問題關鍵字（例如：疫苗、預約、取消...）"
          className="w-full border border-stone-200 rounded-2xl pl-12 pr-6 py-4 text-sm outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-white shadow-sm transition-all"
        />
      </div>

      {/* FAQ Accordion Lists */}
      <div className="space-y-10">
        {filteredFaqs.length > 0 ? (
          filteredFaqs.map((cat) => (
            <div key={cat.category} className="bg-white border border-stone-100 rounded-3xl p-8 shadow-sm">
              <h2 className="text-lg font-black text-stone-900 border-b border-stone-100 pb-4 mb-2 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-orange-500" />
                {cat.category}
              </h2>
              <div>
                {cat.items.map((item, idx) => (
                  <AccordionItem key={idx} q={item.q} a={item.a} />
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-16 bg-white border border-stone-100 rounded-3xl">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="font-bold text-stone-800">找不到相符的問題</h3>
            <p className="text-sm text-stone-400 mt-2">請更換關鍵字搜尋，或直接聯絡我們。</p>
          </div>
        )}
      </div>

      {/* Contact Support CTA */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 rounded-3xl p-8 mt-12 flex flex-col sm:flex-row gap-6 items-center justify-between">
        <div className="flex gap-4 items-start text-left">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-2xl shrink-0">
            💬
          </div>
          <div>
            <h3 className="font-black text-stone-950 text-base">找不到您的答案嗎？</h3>
            <p className="text-stone-500 text-sm leading-relaxed mt-1">
              您可以隨時傳送訊息或致電我們的客服中心，我們將於 08:00 – 20:00 為您解答。
            </p>
          </div>
        </div>
        <Link
          to="/#contact"
          onClick={() => {
            setTimeout(() => {
              document.querySelector('#contact')?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
          }}
          className="flex items-center gap-2 bg-gradient-to-r from-amber-400 to-orange-500 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-md shadow-orange-200/50 shrink-0 hover:-translate-y-0.5 transition-all duration-200"
        >
          <MessageSquare className="w-4 h-4" /> 聯絡客服小組
        </Link>
      </div>
    </DocLayout>
  );
}

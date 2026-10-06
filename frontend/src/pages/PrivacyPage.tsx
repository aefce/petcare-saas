import DocLayout from '../components/layout/DocLayout';

export default function PrivacyPage() {
  return (
    <DocLayout
      breadcrumbs={[{ label: '其他資訊' }, { label: '隱私權政策' }]}
      title="隱私權政策"
      subtitle="我們非常重視您的個人隱私與毛寶貝的資料安全。請詳細閱讀以下隱私權保護政策。"
      accentColor="amber"
    >
      <div className="bg-white border border-stone-100 rounded-3xl p-8 md:p-10 shadow-sm text-stone-600 space-y-8">
        <section>
          <h2 className="text-xl font-black text-stone-900 mb-4 pb-2 border-b border-stone-100">一、 個人資料收集範圍</h2>
          <p className="leading-relaxed mb-3">
            當您註冊本平台帳號或使用本平台服務時，我們可能會收集您的以下資訊：
          </p>
          <ul className="list-disc pl-5 space-y-2 leading-relaxed">
            <li><strong>帳戶基本資料：</strong> 姓名、電子信箱、行動電話、通訊地址。</li>
            <li><strong>寵物基本與健康資料：</strong> 寵物姓名、品種、年齡、疫苗接種記錄書、病史及飲食偏好。</li>
            <li><strong>服務記錄與日誌：</strong> 美容與住宿的預約歷史、照護日誌文字及照護過程的照片與影片。</li>
            <li><strong>系統紀錄：</strong> 您的 IP 位址、瀏覽器類型、使用時間、App 操作點擊紀錄等。</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-black text-stone-900 mb-4 pb-2 border-b border-stone-100">二、 個人資料使用目的</h2>
          <p className="leading-relaxed mb-3">
            我們收集個人與寵物資料的目的在於：
          </p>
          <ul className="list-disc pl-5 space-y-2 leading-relaxed">
            <li><strong>提供服務與預約管理：</strong> 用於核對寵物身分、辦理入住與美容預約登記。</li>
            <li><strong>健康與安全審查：</strong> 用於審核疫苗合規證明的有效性，確保店內群體寵物的健康安全。</li>
            <li><strong>發送即時日誌與通知：</strong> 將美容進度照片、照護日誌、打卡狀態或疫苗到期提醒等訊息推播給您。</li>
            <li><strong>客戶服務與回饋：</strong> 用於聯絡您、處理諮詢或退款申請，並進行滿意度調查。</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-black text-stone-900 mb-4 pb-2 border-b border-stone-100">三、 資料安全與保護</h2>
          <ul className="list-disc pl-5 space-y-2 leading-relaxed">
            <li>我們採用業界標準的傳輸加密協定（HTTPS/SSL）與加密數據庫存儲技術，防止您的資料遭外洩或非法篡改。</li>
            <li>本平台僅有獲得授權的工作人員（照護員、美容師與系統管理員）在其職務範圍內，方可存取您的個人與寵物檔案。</li>
            <li>若發生訪客帳號 30 天過期的情況，該訪客帳號所關聯的個人隱私資料與照護歷史記錄將會被系統排程刪除。</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-black text-stone-900 mb-4 pb-2 border-b border-stone-100">四、 第三方揭露聲明</h2>
          <p className="leading-relaxed">
            本平台承諾不會將您的個人資料出售、出租或洩露給任何無關之第三方。但於下列特殊情況下，我們將依法或必要性揭露您的資料：
          </p>
          <ul className="list-disc pl-5 space-y-2 leading-relaxed">
            <li><strong>緊急醫療：</strong> 寵物突發病痛需送往獸醫院急診時，我們將向合作獸醫院提供您的緊急聯絡人姓名、電話及寵物病史。</li>
            <li><strong>法律要求：</strong> 配合法院或政府機關的法定調查程序，依法提供相關資料。</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-black text-stone-900 mb-4 pb-2 border-b border-stone-100">五、 用戶權利與刪除帳戶</h2>
          <p className="leading-relaxed">
            您有權隨時登入平台修改您的個人與寵物資料。若您決定停止使用本平台服務，並希望完全刪除您的個人帳號及所有相關歷史資料（包括寵物日誌照片等），您可以聯繫客服小組申請「銷戶與資料抹除」。我們將在收到申請並驗證身分後的 7 個工作日內，將您的個人資料從主要數據庫中完全刪除。
          </p>
        </section>

        <section>
          <h2 className="text-xl font-black text-stone-900 mb-4 pb-2 border-b border-stone-100">六、 隱私政策更新</h2>
          <p className="leading-relaxed">
            本隱私權政策將隨著法律修訂或本平台功能調整而不定期更新。更新後的版本會即時公佈於本頁面，並更新最上方之修訂日期。建議您定期閱讀本頁面以掌握最新權益說明。
          </p>
        </section>
      </div>
    </DocLayout>
  );
}

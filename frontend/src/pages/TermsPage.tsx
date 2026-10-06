import DocLayout from '../components/layout/DocLayout';

export default function TermsPage() {
  return (
    <DocLayout
      breadcrumbs={[{ label: '其他資訊' }, { label: '服務條款' }]}
      title="服務條款"
      subtitle="請在註冊使用毛星球寵物照護平台前，仔細閱讀以下服務條款。"
      accentColor="amber"
    >
      <div className="bg-white border border-stone-100 rounded-3xl p-8 md:p-10 shadow-sm text-stone-600 space-y-8">
        <section>
          <h2 className="text-xl font-black text-stone-900 mb-4 pb-2 border-b border-stone-100">一、 條款之接受</h2>
          <p className="leading-relaxed">
            歡迎您使用「毛星球寵物照護平台」（以下簡稱「本平台」）。當您完成註冊或開始使用本平台所提供的各項服務時，即視為您已閱讀、理解並同意受本服務條款所有內容之約束。若您不同意本條款之任何部分，請立即停止使用本平台。
          </p>
        </section>

        <section>
          <h2 className="text-xl font-black text-stone-900 mb-4 pb-2 border-b border-stone-100">二、 帳戶註冊與安全</h2>
          <ul className="list-disc pl-5 space-y-2 leading-relaxed">
            <li>您應提供真實、準確且完整的個人資料以完成註冊，並有義務隨時更新資料以維持其正確性。</li>
            <li>您有責任妥善保管您的帳戶密碼，任何使用您帳戶進行的操作均視為您本人的行為。若發現帳戶遭未授權使用，請立即通知本平台客服。</li>
            <li>
              <strong>訪客帳號限制：</strong>
              本平台提供「訪客帳號」臨時註冊功能。訪客帳號有效期為 30 天，過期後該帳戶將自動失效且無法取回。訪客帳戶僅限查看歷史日誌與寵物進度，無法使用美容與旅館預約服務。
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-black text-stone-900 mb-4 pb-2 border-b border-stone-100">三、 疫苗合規入住政策</h2>
          <p className="leading-relaxed mb-3">
            為保障所有入住寵物之健康與環境安全，本平台精品旅館實施強制性疫苗審查制度：
          </p>
          <ul className="list-disc pl-5 space-y-2 leading-relaxed">
            <li>飼主在提交旅館預約前，必須上傳有效期限內的疫苗接種證明書照片。</li>
            <li>審查通過後，旅館預約方可確認成立。若未能提供有效證明，本平台有權拒絕辦理入住，且不退還當次住宿訂金。</li>
            <li>因生理特殊狀況無法接種疫苗者，應提供合格獸醫院開立之不適宜接種診斷書，由工作人員評估是否進行獨立客房隔離入住。</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-black text-stone-900 mb-4 pb-2 border-b border-stone-100">四、 預約與退費規則</h2>
          <ul className="list-disc pl-5 space-y-2 leading-relaxed">
            <li>
              <strong>一般美容：</strong>
              美容預約可於服務開始前 24 小時免費取消或變更。24 小時內取消或未到店，系統將限制下一次線上預約權限。
            </li>
            <li>
              <strong>旅館住宿：</strong>
              若於入住前 3 日取消，退還 100% 訂金；於入住前 1-2 日取消，扣除訂金的 50%；入住當日取消或未辦理入住，恕不退還訂金。
            </li>
            <li>
              <strong>VIP 會員年度方案：</strong>
              VIP 會員方案為一次性按年收費商品，一經訂閱開通，恕不接受中途退訂或比例退款。
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-black text-stone-900 mb-4 pb-2 border-b border-stone-100">五、 緊急醫療處置聲明</h2>
          <p className="leading-relaxed">
            若寵物在入住或美容期間發生突發性傷病，本平台工作人員會立即電話聯繫飼主。在無法取得聯繫或情況緊急時，本平台有權直接將寵物送往合作之獸醫院進行急診治療。所有醫療急診費用（包含診療費、藥費、檢驗費等）由飼主全額承擔。工作人員僅協助送醫與照護陪同，不代為簽署涉及重大風險之手術同意書。
          </p>
        </section>

        <section>
          <h2 className="text-xl font-black text-stone-900 mb-4 pb-2 border-b border-stone-100">六、 條款修改與終止</h2>
          <p className="leading-relaxed">
            本平台保留隨時修改本服務條款之權利，修改後的內容將公佈於本頁面，不另行個別通知。您在條款修改後繼續使用本平台，即視為您已接受修改後的條款。若您違反本服務條款，本平台有權在未經通知的情況下，暫停或永久終止您的帳戶。
          </p>
        </section>
      </div>
    </DocLayout>
  );
}

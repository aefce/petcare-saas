## MODIFIED Requirements

### Requirement: 系統可以接收金流付款通知 (System can receive payment notifications)
系統「必須 (SHALL)」暴露一個 Webhook 端點，用以接收來自外部金流閘道 (例如 Stripe 或本地金流) 的非同步付款狀態更新。所有金流 API 必須實作冪等性保護 (Idempotency)。

#### Scenario: 成功接收付款 (Successful payment received)
- **WHEN** 金流閘道發送一個表示付款成功的 webhook payload 時
- **THEN** 系統驗證簽章，檢查 Idempotency Key 以避免重複扣款，將對應的預約狀態標記為 PAID，並記錄該筆交易

### Requirement: 拒絕無效的 webhook 簽章 (Invalid webhook signatures are rejected)
系統「必須 (MUST)」使用簽章驗證來確認傳入之金流 webhook 的真實性。

#### Scenario: 無效的簽章 (Invalid signature)
- **WHEN** 系統接收到帶有無效或遺失簽章的 webhook 時
- **THEN** 系統以 401 Unauthorized (未授權) 狀態拒絕該請求，且「不會」更新任何資料紀錄

## ADDED Requirements

### Requirement: 金流背景對帳機制 (Background Reconciliation)
系統「必須 (MUST)」具備背景排程定期與金流閘道 (Gateway) 同步，自動校正因 Timeout 或網路異常造成的訂單狀態不一致。

#### Scenario: 自動校正異常訂單 (Auto-correct timeout order)
- **WHEN** 系統存在超過 15 分鐘狀態仍未確定的付款訂單時
- **THEN** 排程任務向金流閘道發起查詢，並根據真實結果 (成功/失敗) 更新內部訂單狀態與預約狀態

### Requirement: 15 分鐘價格快照 (15-minute Price Snapshot)
系統「必須 (SHALL)」在產生訂單時建立 15 分鐘的價格快照 (Snapshot)，確保結帳金額不受後台動態定價的即時異動影響。

#### Scenario: 結帳時價格不變 (Price remains constant during checkout)
- **WHEN** 使用者進入結帳流程，同時管理員在後台調漲了該服務的價格
- **THEN** 使用者的結帳金額仍維持在訂單產生時的快照價格，不受漲價影響

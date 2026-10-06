## ADDED Requirements

### Requirement: 寵物風險與行為標籤 (Pet risk and behavior tags)
系統「必須 (SHALL)」支援替寵物綁定行為標籤（例如：具攻擊性、會咬人），且當觸發特定行為時在前端顯示紅燈警告 Modal。

#### Scenario: 掃描晶片觸發警示 (Scanning chip triggers alert)
- **WHEN** 員工掃描寵物晶片或在系統中存取帶有危險標籤的寵物紀錄時
- **THEN** 系統前端強制彈出紅燈警告 Modal，且非管理員無法竄改該風險標籤

### Requirement: 軟刪除與不可變稽核日誌 (Soft Delete and Immutable Audit Trail)
核心業務表「必須 (MUST)」實作 Soft Delete 邏輯（僅管理員可執行 Hard Delete）。所有關鍵操作「必須 (MUST)」寫入不可變的稽核日誌 (Append-only, UTC 時間)。

#### Scenario: 員工刪除預約 (Staff deletes an appointment)
- **WHEN** 員工執行刪除預約操作時
- **THEN** 系統將該紀錄標記為 `deleted_at = <UTC_TIME>` (Soft Delete)，並在稽核表中以 Append-only 方式寫入一筆包含操作者 ID 與變更內容的日誌

### Requirement: API 流量管制 (Rate Limiting)
閘道層「必須 (MUST)」實作基於 User 或 IP 的 Rate Limiting 以防止惡意請求。

#### Scenario: 請求超過上限 (Requests exceed limit)
- **WHEN** 來自同一 IP 或 User 的 API 請求在短時間內超過設定的閾值時
- **THEN** 系統阻擋請求並回傳 `429 Too Many Requests`

### Requirement: 容錯降級與死信佇列 (Graceful Degradation and DLQ)
系統在呼叫第三方 API (如簡訊、金流) 時「必須 (MUST)」具備容錯降級機制，且失敗的非同步任務需進入 Dead Letter Queue (DLQ)。

#### Scenario: 簡訊服務斷線 (SMS service is down)
- **WHEN** 系統嘗試發送確認簡訊但第三方服務回應逾時或 500 錯誤時
- **THEN** 系統不阻擋主業務流程（Graceful Degradation），而是將該通知任務放入 DLQ 等待後續重試，並觸發系統警報

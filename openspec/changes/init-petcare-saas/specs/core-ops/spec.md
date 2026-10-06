## ADDED Requirements

### Requirement: 預約資源 15 分鐘鎖定 (15-minute Resource Lock)
系統「必須 (MUST)」在使用者進入預約流程時套用 15 分鐘的 Atomic Resource Lock (TTL)，且進入付款前需驗證鎖定未失效 (Stale Lock Check)。

#### Scenario: 付款前鎖定超時 (Lock timeout before payment)
- **WHEN** 使用者嘗試付款，但距離選擇資源已超過 15 分鐘時
- **THEN** 系統拒絕付款請求，提示預約超時，並要求使用者重新選擇資源

### Requirement: 寵物疫苗紀錄驗證 (Pet vaccine validation)
系統「必須 (MUST)」在建立預約時檢查該寵物的疫苗紀錄是否有效。

#### Scenario: 疫苗過期阻擋預約 (Expired vaccine blocks booking)
- **WHEN** 飼主選擇一隻疫苗紀錄已過期或未填寫的寵物進行預約時
- **THEN** 系統在 API 層阻擋該請求，並回傳錯誤訊息要求更新疫苗資訊

### Requirement: 依體型自動派房 (Auto room assignment by pet size)
系統「必須 (SHALL)」根據寵物的體型標籤自動分派對應尺寸的房間。

#### Scenario: 系統自動分派中型房 (System assigns medium room)
- **WHEN** 飼主為一隻體型登記為「中型犬」的寵物預約住宿時
- **THEN** 系統自動保留一間中型房資源；若管理員手動介入升級房型，系統將重新計算差價

### Requirement: 自動釋放與取消違約預約 (Auto cancel and release resources)
系統「必須 (MUST)」透過背景排程檢測逾期未報到或違約的訂單，釋放其佔用的資源並計算違約金。

#### Scenario: 逾期未報到自動釋放資源 (No-show releases room)
- **WHEN** 預約時間超過寬限期且顧客未報到時
- **THEN** 系統將訂單狀態改為取消、釋放房間資源，並觸發違約金扣款流程

### Requirement: 實體現場客報到 (Walk-in customer handling)
系統「必須 (SHALL)」支援櫃台員工為無註冊帳號的實體現場客建立訂單，並即時扣除現場可用資源。

#### Scenario: 掃描器報到與即時扣留 (Scanner check-in)
- **WHEN** 櫃台透過硬體掃描器或手動輸入為現場客建立美容訂單時
- **THEN** 系統即時扣除美容師可用時段，並產生一筆現場訂單紀錄

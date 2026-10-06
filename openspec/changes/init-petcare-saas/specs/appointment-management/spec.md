## ADDED Requirements

### Requirement: 寵物主人可以預約 (Pet owner can book an appointment)
系統「必須 (SHALL)」允許寵物主人透過選擇寵物、服務項目以及可用的時段來進行預約。

#### Scenario: 預約成功 (Successful booking)
- **WHEN** 使用者針對可用時段提供有效的預約詳細資訊時
- **THEN** 系統建立一筆狀態為 PENDING (待確認) 的預約，並回傳預約確認資訊

### Requirement: 預約狀態流轉 (Appointment status transition)
系統「必須 (MUST)」允許根據業務規則轉換預約狀態（例如：PENDING -> CONFIRMED -> COMPLETED -> PAID）。

#### Scenario: 管理員確認預約 (Admin confirms appointment)
- **WHEN** 管理員將一筆 PENDING 狀態的預約更新為 CONFIRMED (已確認) 時
- **THEN** 系統將狀態更新為 CONFIRMED，並且通知使用者

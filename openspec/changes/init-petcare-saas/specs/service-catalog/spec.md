## ADDED Requirements

### Requirement: 管理員可以管理服務目錄 (Admin can manage service catalog)
系統「必須 (SHALL)」允許管理員新增、更新或移除該店面所提供的服務項目。

#### Scenario: 管理員新增服務 (Admin adds a new service)
- **WHEN** 管理員建立一項包含名稱、描述、耗時及價格的新服務時
- **THEN** 該項新服務將開放讓使用者在預約時可以選擇

### Requirement: 使用者可以查看可用的服務 (Users can view available services)
系統「必須 (MUST)」提供一個端點，讓使用者可以取得目前啟用的服務清單及其詳細資訊。

#### Scenario: 使用者取得服務目錄 (User fetches service catalog)
- **WHEN** 使用者請求取得服務清單時
- **THEN** 系統回傳所有標記為啟用 (active) 的服務項目

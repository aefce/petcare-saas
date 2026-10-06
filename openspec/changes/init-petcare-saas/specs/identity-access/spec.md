## ADDED Requirements

### Requirement: 系統入口分離 (Separate portals for Owners and Staff)
系統「必須 (MUST)」將飼主 (Owner) 與員工 (Staff) 擁有獨立的操作介面，且 API 需透過 Namespace (如 `/admin`) 分離。

#### Scenario: 員工登入後台 (Staff logs into admin portal)
- **WHEN** 員工訪問 `/admin` 路徑並成功登入時
- **THEN** 系統發放包含 Staff Role 的 JWT，並允許存取管理介面

### Requirement: 基於角色的存取控制 (RBAC)
系統「必須 (MUST)」在 API Controller 層級進行權限校驗。

#### Scenario: 越權操作被拒絕 (Unauthorized access rejected)
- **WHEN** 僅具備飼主權限的帳號嘗試呼叫需要管理員權限的 API 時
- **THEN** 系統阻擋該操作並回傳 HTTP `403 Forbidden` 狀態碼

### Requirement: Guest 無縫升級 (Guest to Member upgrade)
系統「必須 (SHALL)」支援訪客 (Guest) 單鍵升級為正式會員 (Member)，並自動同步其歷史寵物與預約紀錄。

#### Scenario: 訪客註冊為會員 (Guest registers as member)
- **WHEN** 訪客完成手機或 Email 驗證升級為會員時
- **THEN** 系統將關聯的 Session/Cookie 紀錄轉移至新建立的 Member 帳號下

### Requirement: 密碼管理與複雜度限制 (Password complexity and reset)
系統「必須 (MUST)」強制設定密碼複雜度規則，並支援 MFA 或 Email 驗證進行密碼重置。

#### Scenario: 使用者重置密碼 (User resets password)
- **WHEN** 使用者點擊忘記密碼並提交有效的驗證碼時
- **THEN** 系統允許使用者設定符合複雜度規則的新密碼

### Requirement: 員工帳號自動登出與 Token 撤銷 (Auto logout and token revocation)
系統「必須 (MUST)」在員工後台閒置滿 30 分鐘時自動將其登出，且在伺服器端將對應的 Session/JWT 標記為撤銷 (Revoked)。

#### Scenario: 閒置登出 (Idle logout)
- **WHEN** 員工帳號超過 30 分鐘沒有發送任何 API 請求時
- **THEN** 系統自動使其登出，且該舊有 JWT 再次發送請求時將回傳 `401 Unauthorized`

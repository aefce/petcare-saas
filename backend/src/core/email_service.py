import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from src.core.config import settings

def send_email(to_email: str, subject: str, html_content: str):
    """
    實作真實的 SMTP 發信邏輯 (UR-15)
    """
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        print(f"⚠️ [MOCK EMAIL] TO: {to_email} | SUBJ: {subject} | CONTENT: {html_content}")
        return

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = settings.SMTP_USER
    msg["To"] = to_email

    part = MIMEText(html_content, "html")
    msg.attach(part)

    try:
        server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT)
        if settings.SMTP_TLS:
            server.starttls()
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.sendmail(settings.SMTP_USER, to_email, msg.as_string())
        server.quit()
        print(f"✅ Email sent successfully to {to_email}")
    except Exception as e:
        print(f"❌ Failed to send email: {str(e)}")
        raise e

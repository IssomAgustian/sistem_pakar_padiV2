"""
Email Notification Service
Handles sending email notifications using SMTP settings from database
"""
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.models.system_settings import SystemSettings


class EmailService:
    """
    Service for sending email notifications
    """

    def __init__(self):
        """Initialize email service with settings from database"""
        self.smtp_host = None
        self.smtp_port = None
        self.smtp_username = None
        self.smtp_password = None
        self.enabled = False

        self._load_settings()

    def _load_settings(self):
        """Load SMTP settings from database"""
        try:
            # Check if email notifications are enabled
            enabled_setting = SystemSettings.query.filter_by(
                setting_key='enable_email_notifications'
            ).first()

            if not enabled_setting or enabled_setting.setting_value.lower() != 'true':
                return

            # Load SMTP settings
            smtp_host = SystemSettings.query.filter_by(setting_key='smtp_host').first()
            smtp_port = SystemSettings.query.filter_by(setting_key='smtp_port').first()
            smtp_username = SystemSettings.query.filter_by(setting_key='smtp_username').first()
            smtp_password = SystemSettings.query.filter_by(setting_key='smtp_password').first()

            # Validate all required settings are present
            if all([smtp_host, smtp_port, smtp_username, smtp_password]):
                self.smtp_host = smtp_host.setting_value
                self.smtp_port = int(smtp_port.setting_value)
                self.smtp_username = smtp_username.setting_value
                self.smtp_password = smtp_password.setting_value
                self.enabled = True

        except Exception as e:
            print(f"Error loading email settings: {e}")
            self.enabled = False

    def send_email(self, to_email, subject, body, is_html=False):
        """
        Send email notification

        Args:
            to_email: Recipient email address
            subject: Email subject
            body: Email body content
            is_html: Whether body is HTML (default: False)

        Returns:
            dict: {'success': bool, 'message': str}
        """
        if not self.enabled:
            return {
                'success': False,
                'message': 'Email notifications are not enabled or configured'
            }

        try:
            # Create message
            msg = MIMEMultipart('alternative')
            msg['From'] = self.smtp_username
            msg['To'] = to_email
            msg['Subject'] = subject

            # Attach body
            mime_type = 'html' if is_html else 'plain'
            msg.attach(MIMEText(body, mime_type))

            # Connect to SMTP server and send
            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                server.starttls()  # Enable TLS encryption
                server.login(self.smtp_username, self.smtp_password)
                server.send_message(msg)

            return {
                'success': True,
                'message': 'Email sent successfully'
            }

        except smtplib.SMTPAuthenticationError:
            return {
                'success': False,
                'message': 'SMTP authentication failed. Check username and password.'
            }
        except smtplib.SMTPException as e:
            return {
                'success': False,
                'message': f'SMTP error: {str(e)}'
            }
        except Exception as e:
            return {
                'success': False,
                'message': f'Failed to send email: {str(e)}'
            }

    def send_diagnosis_notification(self, user_email, user_name, disease_name):
        """
        Send notification email when a diagnosis is completed

        Args:
            user_email: User's email address
            user_name: User's name
            disease_name: Diagnosed disease name

        Returns:
            dict: {'success': bool, 'message': str}
        """
        if not self.enabled:
            return {'success': False, 'message': 'Email notifications disabled'}

        subject = 'Hasil Diagnosis - Sistem Pakar Padi'
        body = f"""
        Halo {user_name},

        Diagnosis Anda telah selesai.

        Hasil Diagnosis: {disease_name}

        Silakan login ke aplikasi untuk melihat detail lengkap dan rekomendasi penanganan.

        Terima kasih telah menggunakan Sistem Pakar Diagnosis Penyakit Tanaman Padi.

        ---
        Email ini dikirim secara otomatis, mohon tidak membalas.
        """

        return self.send_email(user_email, subject, body.strip())

    def send_test_email(self, to_email):
        """
        Send test email to verify SMTP configuration

        Args:
            to_email: Test recipient email

        Returns:
            dict: {'success': bool, 'message': str}
        """
        subject = 'Test Email - Sistem Pakar Padi'
        body = """
        Ini adalah email test dari Sistem Pakar Diagnosis Penyakit Tanaman Padi.

        Jika Anda menerima email ini, berarti konfigurasi SMTP Anda sudah benar.

        Terima kasih!
        """

        return self.send_email(to_email, subject, body.strip())

    @staticmethod
    def test_smtp_connection():
        """
        Test SMTP connection without sending email

        Returns:
            dict: {'success': bool, 'message': str}
        """
        try:
            # Load settings
            smtp_host = SystemSettings.query.filter_by(setting_key='smtp_host').first()
            smtp_port = SystemSettings.query.filter_by(setting_key='smtp_port').first()
            smtp_username = SystemSettings.query.filter_by(setting_key='smtp_username').first()
            smtp_password = SystemSettings.query.filter_by(setting_key='smtp_password').first()

            if not all([smtp_host, smtp_port, smtp_username, smtp_password]):
                return {
                    'success': False,
                    'message': 'SMTP settings incomplete'
                }

            # Test connection
            with smtplib.SMTP(smtp_host.setting_value, int(smtp_port.setting_value), timeout=10) as server:
                server.starttls()
                server.login(smtp_username.setting_value, smtp_password.setting_value)

            return {
                'success': True,
                'message': 'SMTP connection successful'
            }

        except smtplib.SMTPAuthenticationError:
            return {
                'success': False,
                'message': 'SMTP authentication failed. Check username and password.'
            }
        except smtplib.SMTPException as e:
            return {
                'success': False,
                'message': f'SMTP error: {str(e)}'
            }
        except Exception as e:
            return {
                'success': False,
                'message': f'Connection failed: {str(e)}'
            }

"""
Admin - Pengaturan Sistem (System Settings)
Session-based authentication
"""
from flask import Blueprint, jsonify, request, render_template, session
import importlib
from app import db
from app.models.system_settings import SystemSettings
import json

bp = Blueprint('admin_settings', __name__)


def check_admin_session():
    """Check if admin is logged in"""
    if 'admin_id' not in session:
        return False
    return True


def get_or_create_setting(key, default_value=''):
    """Get setting or create if not exists"""
    setting = SystemSettings.query.filter_by(setting_key=key).first()
    if not setting:
        setting = SystemSettings(
            setting_key=key,
            setting_value=default_value,
            description=''
        )
        db.session.add(setting)
        db.session.commit()
    return setting


@bp.route('/', methods=['GET'])
def settings_page():
    """Render settings page"""
    if not check_admin_session():
        return render_template('admin/auth_required.html'), 401
    return render_template('admin/pengaturan_sistem.html')


@bp.route('/current', methods=['GET'])
def get_current_settings():
    """Get all current system settings"""
    if not check_admin_session():
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401

    try:
        # Define default settings
        default_settings = {
            'ai_provider': 'openai',
            'openai_api_key': '',
            'gemini_api_key': '',
            'history_retention_days': '30',
            'max_diagnoses_per_day': '20',
            'maintenance_mode': 'false',
            'maintenance_message': '',
            'smtp_host': '',
            'smtp_port': '587',
            'smtp_username': '',
            'smtp_password': '',
            'enable_email_notifications': 'false'
        }

        # Get all settings from database
        settings_dict = {}
        for key in default_settings.keys():
            setting = get_or_create_setting(key, default_settings[key])
            settings_dict[key] = setting.setting_value

        return jsonify({
            'success': True,
            'data': settings_dict
        })
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@bp.route('/save', methods=['POST'])
def save_settings():
    """Save all system settings"""
    if not check_admin_session():
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401

    try:
        data = request.get_json()

        if not data:
            return jsonify({'success': False, 'message': 'No data provided'}), 400

        # Update each setting
        for key, value in data.items():
            setting = SystemSettings.query.filter_by(setting_key=key).first()
            if setting:
                setting.setting_value = str(value) if value is not None else ''
            else:
                # Create new setting
                new_setting = SystemSettings(
                    setting_key=key,
                    setting_value=str(value) if value is not None else '',
                    description=f'Auto-created setting for {key}'
                )
                db.session.add(new_setting)

        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Pengaturan berhasil disimpan'
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


@bp.route('/test-ai-connection', methods=['POST'])
def test_ai_connection():
    """Test AI API connection"""
    if not check_admin_session():
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401

    try:
        data = request.get_json()
        provider = data.get('provider')  # 'openai' or 'gemini'
        api_key = data.get('api_key')

        print(f"[DEBUG] Testing AI connection - Provider: {provider}, API Key length: {len(api_key) if api_key else 0}")

        if not provider or not api_key:
            print(f"[DEBUG] Validation failed - Provider: {provider}, API key empty: {not api_key}")
            return jsonify({
                'success': False,
                'message': 'Provider dan API key harus diisi'
            }), 400

        # Test connection based on provider
        if provider == 'openai':
            # Test OpenAI connection
            # Validate API key format first
            if not api_key.startswith('sk-'):
                return jsonify({
                    'success': False,
                    'message': 'Format API key OpenAI tidak valid (harus dimulai dengan "sk-")'
                }), 400

            # Try a minimal API call
            try:
                try:
                    openai_module = importlib.import_module("openai")
                except ImportError:
                    return jsonify({
                        'success': False,
                        'message': 'Library OpenAI belum terinstall. Jalankan: pip install openai'
                    }), 500

                OpenAI = getattr(openai_module, "OpenAI", None)
                if OpenAI is None:
                    return jsonify({
                        'success': False,
                        'message': 'Versi library OpenAI tidak mendukung OpenAI client. Jalankan: pip install --upgrade openai'
                    }), 500

                print(f"[DEBUG] Creating OpenAI client...")
                client = OpenAI(api_key=api_key)

                print(f"[DEBUG] Making test API call...")
                # Make a simple chat completion as a test
                response = client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {"role": "user", "content": "Hello"}
                    ],
                    max_tokens=5
                )

                print(f"[DEBUG] API call successful!")
                return jsonify({
                    'success': True,
                    'message': 'Koneksi OpenAI berhasil! API Key valid.'
                })

            except Exception as api_error:
                error_msg = str(api_error)
                print(f"[DEBUG] OpenAI API Error: {error_msg}")

                # Handle specific error cases
                if 'authentication' in error_msg.lower() or 'api key' in error_msg.lower():
                    return jsonify({
                        'success': False,
                        'message': 'API Key tidak valid atau sudah expired'
                    }), 400
                elif 'quota' in error_msg.lower() or 'exceeded' in error_msg.lower():
                    return jsonify({
                        'success': False,
                        'message': 'API Key valid, tapi quota sudah habis'
                    }), 400
                else:
                    return jsonify({
                        'success': False,
                        'message': f'Koneksi gagal: {error_msg}'
                    }), 400

        elif provider == 'gemini':
            # Test Gemini connection
            try:
                genai = importlib.import_module("google.generativeai")
            except ImportError:
                return jsonify({
                    'success': False,
                    'message': 'Library Google Generative AI belum terinstall. Jalankan: pip install google-generativeai'
                }), 500
            genai.configure(api_key=api_key)

            # Try to list models or make a simple request
            try:
                # Use gemini-2.5-flash (current stable model)
                model = genai.GenerativeModel('gemini-2.5-flash')
                # Test with a simple prompt
                response = model.generate_content("Hello")
                return jsonify({
                    'success': True,
                    'message': 'Koneksi Gemini berhasil! API Key valid.'
                })
            except Exception as api_error:
                error_msg = str(api_error)
                # Handle specific error cases
                if 'API_KEY_INVALID' in error_msg or 'invalid' in error_msg.lower():
                    return jsonify({
                        'success': False,
                        'message': 'API Key tidak valid atau sudah expired'
                    }), 400
                else:
                    return jsonify({
                        'success': False,
                        'message': f'Koneksi gagal: {error_msg}'
                    }), 400

        else:
            return jsonify({
                'success': False,
                'message': 'Provider tidak valid (harus "openai" atau "gemini")'
            }), 400

    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error: {str(e)}'
        }), 500


@bp.route('/cleanup/stats', methods=['GET'])
def get_cleanup_stats():
    """Get cleanup statistics"""
    if not check_admin_session():
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401

    try:
        from app.services.cleanup_service import CleanupService
        stats = CleanupService.get_cleanup_stats()
        return jsonify(stats)
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@bp.route('/cleanup/run', methods=['POST'])
def run_cleanup():
    """Run cleanup of old history data"""
    if not check_admin_session():
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401

    try:
        from app.services.cleanup_service import CleanupService
        result = CleanupService.cleanup_old_history()
        return jsonify(result)
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@bp.route('/test-email-connection', methods=['POST'])
def test_email_connection():
    """Test email SMTP connection"""
    if not check_admin_session():
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401

    try:
        from app.services.email_service import EmailService
        result = EmailService.test_smtp_connection()
        return jsonify(result)
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@bp.route('/send-test-email', methods=['POST'])
def send_test_email():
    """Send test email"""
    if not check_admin_session():
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401

    try:
        data = request.get_json()
        to_email = data.get('to_email')

        if not to_email:
            return jsonify({
                'success': False,
                'message': 'Email address required'
            }), 400

        from app.services.email_service import EmailService
        email_service = EmailService()
        result = email_service.send_test_email(to_email)
        return jsonify(result)
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

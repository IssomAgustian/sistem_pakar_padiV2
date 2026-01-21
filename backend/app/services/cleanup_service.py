"""
Cleanup Service
Handles automatic cleanup of old data based on retention settings
"""
from datetime import datetime, timedelta
from app import db
from app.models.history import DiagnosisHistory
from app.models.admin_log import AdminLog
from app.models.system_settings import SystemSettings


class CleanupService:
    """
    Service for cleaning up old data
    """

    @staticmethod
    def cleanup_old_history():
        """
        Delete diagnosis history older than retention days setting
        Returns: dict with cleanup results
        """
        try:
            # Get retention days from settings
            retention_setting = SystemSettings.query.filter_by(
                setting_key='history_retention_days'
            ).first()

            if not retention_setting or not retention_setting.setting_value:
                return {
                    'success': False,
                    'message': 'Retention days setting not found'
                }

            try:
                retention_days = int(retention_setting.setting_value)
            except ValueError:
                return {
                    'success': False,
                    'message': 'Invalid retention days value'
                }

            # Calculate cutoff date
            cutoff_date = datetime.now() - timedelta(days=retention_days)

            # Count records to be deleted
            old_records = DiagnosisHistory.query.filter(
                DiagnosisHistory.diagnosis_date < cutoff_date
            ).all()

            count = len(old_records)

            if count == 0:
                return {
                    'success': True,
                    'message': 'No old records to delete',
                    'deleted_count': 0
                }

            # Delete old records
            for record in old_records:
                db.session.delete(record)

            db.session.commit()

            return {
                'success': True,
                'message': f'Successfully deleted {count} old diagnosis records',
                'deleted_count': count,
                'cutoff_date': cutoff_date.strftime('%Y-%m-%d')
            }

        except Exception as e:
            db.session.rollback()
            return {
                'success': False,
                'message': f'Cleanup failed: {str(e)}',
                'deleted_count': 0
            }

    @staticmethod
    def cleanup_old_admin_logs(retention_days=90):
        """
        Delete admin logs older than specified days
        Returns: dict with cleanup results
        """
        try:
            cutoff_date = datetime.now() - timedelta(days=retention_days)

            old_logs = AdminLog.query.filter(
                AdminLog.created_at < cutoff_date
            ).all()

            count = len(old_logs)

            if count == 0:
                return {
                    'success': True,
                    'message': 'No old logs to delete',
                    'deleted_count': 0
                }

            for log in old_logs:
                db.session.delete(log)

            db.session.commit()

            return {
                'success': True,
                'message': f'Successfully deleted {count} old admin logs',
                'deleted_count': count,
                'cutoff_date': cutoff_date.strftime('%Y-%m-%d')
            }

        except Exception as e:
            db.session.rollback()
            return {
                'success': False,
                'message': f'Cleanup failed: {str(e)}',
                'deleted_count': 0
            }

    @staticmethod
    def get_cleanup_stats():
        """
        Get statistics about data that can be cleaned up
        Returns: dict with statistics
        """
        try:
            # Get retention days
            retention_setting = SystemSettings.query.filter_by(
                setting_key='history_retention_days'
            ).first()

            if not retention_setting:
                return {
                    'success': False,
                    'message': 'Retention setting not found'
                }

            try:
                retention_days = int(retention_setting.setting_value)
            except ValueError:
                return {
                    'success': False,
                    'message': 'Invalid retention days value'
                }

            cutoff_date = datetime.now() - timedelta(days=retention_days)

            # Count old records
            old_history_count = DiagnosisHistory.query.filter(
                DiagnosisHistory.diagnosis_date < cutoff_date
            ).count()

            total_history_count = DiagnosisHistory.query.count()

            return {
                'success': True,
                'retention_days': retention_days,
                'cutoff_date': cutoff_date.strftime('%Y-%m-%d'),
                'old_records_count': old_history_count,
                'total_records_count': total_history_count,
                'will_be_deleted': old_history_count
            }

        except Exception as e:
            return {
                'success': False,
                'message': f'Failed to get stats: {str(e)}'
            }

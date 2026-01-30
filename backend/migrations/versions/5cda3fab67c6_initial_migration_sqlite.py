"""Initial migration - core schema

Revision ID: 5cda3fab67c6
Revises:
Create Date: 2025-11-05 10:18:32.011793

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '5cda3fab67c6'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Users
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('password_hash', sa.String(length=255), nullable=True),
        sa.Column('full_name', sa.String(length=100), nullable=True),
        sa.Column('google_id', sa.String(length=255), nullable=True),
        sa.Column('role', sa.String(length=20), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('last_login', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email'),
        sa.UniqueConstraint('google_id')
    )
    op.create_index('ix_users_email', 'users', ['email'], unique=True)
    op.create_index('ix_users_google_id', 'users', ['google_id'], unique=True)

    # Diseases
    op.create_table(
        'diseases',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('code', sa.String(length=10), nullable=False),
        sa.Column('name', sa.String(length=150), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('code')
    )
    op.create_index('ix_diseases_code', 'diseases', ['code'], unique=True)

    # Symptoms
    op.create_table(
        'symptoms',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('code', sa.String(length=10), nullable=False),
        sa.Column('name', sa.String(length=200), nullable=False),
        sa.Column('category', sa.String(length=50), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('mb_value', sa.Numeric(3, 2), nullable=True),
        sa.Column('md_value', sa.Numeric(3, 2), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('code')
    )
    op.create_index('ix_symptoms_code', 'symptoms', ['code'], unique=True)
    op.create_index('ix_symptoms_category', 'symptoms', ['category'], unique=False)

    # Rules
    op.create_table(
        'rules',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('rule_code', sa.String(length=20), nullable=False),
        sa.Column('disease_id', sa.Integer(), nullable=False),
        sa.Column('symptom_ids', sa.PickleType(), nullable=True),
        sa.Column('symptom_id', sa.Integer(), nullable=False),
        sa.Column('confidence_level', sa.Numeric(3, 2), nullable=True),
        sa.Column('mb', sa.Numeric(3, 2), nullable=False),
        sa.Column('md', sa.Numeric(3, 2), nullable=False),
        sa.Column('min_symptom_match', sa.Integer(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['disease_id'], ['diseases.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['symptom_id'], ['symptoms.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('rule_code')
    )

    # System settings
    op.create_table(
        'system_settings',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('setting_key', sa.String(length=100), nullable=False),
        sa.Column('setting_value', sa.Text(), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('setting_key')
    )

    # Admin logs
    op.create_table(
        'admin_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('admin_id', sa.Integer(), nullable=True),
        sa.Column('action', sa.String(length=50), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('table_name', sa.String(length=50), nullable=True),
        sa.Column('record_id', sa.Integer(), nullable=True),
        sa.Column('ip_address', sa.String(length=45), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['admin_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_admin_logs_created_at', 'admin_logs', ['created_at'], unique=False)

    # Diagnosis history
    op.create_table(
        'diagnosis_history',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('disease_id', sa.Integer(), nullable=True),
        sa.Column('selected_symptoms', sa.PickleType(), nullable=True),
        sa.Column('cf_values', sa.PickleType(), nullable=True),
        sa.Column('final_cf_value', sa.Numeric(precision=5, scale=4), nullable=True),
        sa.Column('certainty_level', sa.String(length=30), nullable=True),
        sa.Column('matched_rule_id', sa.Integer(), nullable=True),
        sa.Column('forward_chaining_result', sa.PickleType(), nullable=True),
        sa.Column('diagnosis_results', sa.PickleType(), nullable=True),
        sa.Column('ai_solution', sa.Text(), nullable=True),
        sa.Column('ai_solution_json', sa.PickleType(), nullable=True),
        sa.Column('diagnosis_method', sa.String(length=20), nullable=True),
        sa.Column('diagnosis_date', sa.DateTime(), nullable=True),
        sa.Column('expires_at', sa.DateTime(), nullable=True),
        sa.Column('is_saved', sa.Boolean(), nullable=True),
        sa.Column('ip_address', sa.String(length=45), nullable=True),
        sa.Column('user_agent', sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(['disease_id'], ['diseases.id']),
        sa.ForeignKeyConstraint(['matched_rule_id'], ['rules.id']),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_diagnosis_history_diagnosis_date', 'diagnosis_history', ['diagnosis_date'], unique=False)
    op.create_index('ix_diagnosis_history_expires_at', 'diagnosis_history', ['expires_at'], unique=False)


def downgrade():
    op.drop_index('ix_diagnosis_history_expires_at', table_name='diagnosis_history')
    op.drop_index('ix_diagnosis_history_diagnosis_date', table_name='diagnosis_history')
    op.drop_table('diagnosis_history')

    op.drop_index('ix_admin_logs_created_at', table_name='admin_logs')
    op.drop_table('admin_logs')

    op.drop_table('system_settings')
    op.drop_table('rules')

    op.drop_index('ix_symptoms_category', table_name='symptoms')
    op.drop_index('ix_symptoms_code', table_name='symptoms')
    op.drop_table('symptoms')

    op.drop_index('ix_diseases_code', table_name='diseases')
    op.drop_table('diseases')

    op.drop_index('ix_users_google_id', table_name='users')
    op.drop_index('ix_users_email', table_name='users')
    op.drop_table('users')

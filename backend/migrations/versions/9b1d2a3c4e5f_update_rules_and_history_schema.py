"""Update rules schema and add diagnosis_results

Revision ID: 9b1d2a3c4e5f
Revises: 5cda3fab67c6
Create Date: 2026-01-09 20:15:00.000000
"""
from alembic import op
import sqlalchemy as sa
import pickle
import re


# revision identifiers, used by Alembic.
revision = '9b1d2a3c4e5f'
down_revision = '5cda3fab67c6'
branch_labels = None
depends_on = None


def _parse_rule_code(rule_code):
    if not rule_code:
        return None
    if len(rule_code) > 1 and rule_code[1:].isdigit():
        return int(rule_code[1:])
    return None


def _decode_symptom_ids(symptom_blob):
    if symptom_blob is None:
        return []
    if isinstance(symptom_blob, memoryview):
        symptom_blob = symptom_blob.tobytes()
    try:
        return list(pickle.loads(symptom_blob))
    except Exception:
        try:
            text = symptom_blob.decode('utf-8', errors='ignore')
        except Exception:
            return []
        return [int(x) for x in re.findall(r'\d+', text)]


def _column_exists(conn, table_name, column_name):
    inspector = sa.inspect(conn)
    columns = inspector.get_columns(table_name)
    return any(col.get('name') == column_name for col in columns)


def upgrade():
    conn = op.get_bind()

    # Add new column for parallel CF results in history (skip if exists)
    if not _column_exists(conn, 'diagnosis_history', 'diagnosis_results'):
        with op.batch_alter_table('diagnosis_history', schema=None) as batch_op:
            batch_op.add_column(sa.Column('diagnosis_results', sa.PickleType(), nullable=True))

    # Add new columns to rules table (skip if exists)
    missing_rule_cols = []
    if not _column_exists(conn, 'rules', 'symptom_id'):
        missing_rule_cols.append(sa.Column('symptom_id', sa.Integer(), nullable=True))
    if not _column_exists(conn, 'rules', 'mb'):
        missing_rule_cols.append(sa.Column('mb', sa.Numeric(3, 2), nullable=True))
    if not _column_exists(conn, 'rules', 'md'):
        missing_rule_cols.append(sa.Column('md', sa.Numeric(3, 2), nullable=True))

    if missing_rule_cols:
        with op.batch_alter_table('rules', schema=None) as batch_op:
            for col in missing_rule_cols:
                batch_op.add_column(col)

    # Build symptom MB/MD map
    symptom_map = {}
    for row in conn.execute(sa.text("SELECT id, mb_value, md_value FROM symptoms")):
        symptom_map[row[0]] = (row[1], row[2])

    # Load existing rules (legacy schema)
    rules = conn.execute(sa.text(
        "SELECT id, rule_code, disease_id, symptom_ids, is_active, created_at, updated_at, symptom_id FROM rules"
    )).fetchall()

    # Find next rule code number
    max_num = 0
    for row in rules:
        num = _parse_rule_code(row[1])
        if num and num > max_num:
            max_num = num
    next_num = max_num + 1

    # Expand legacy symptom list into per-symptom rows
    for row in rules:
        rule_id, rule_code, disease_id, symptom_blob, is_active, created_at, updated_at, existing_symptom_id = row
        if existing_symptom_id is not None:
            continue
        symptom_ids = _decode_symptom_ids(symptom_blob)
        if not symptom_ids:
            continue

        first_symptom = symptom_ids[0]
        mb, md = symptom_map.get(first_symptom, (0.5, 0.5))
        conn.execute(
            sa.text("UPDATE rules SET symptom_id = :sid, mb = :mb, md = :md WHERE id = :id"),
            {"sid": first_symptom, "mb": mb, "md": md, "id": rule_id}
        )

        for symptom_id in symptom_ids[1:]:
            mb, md = symptom_map.get(symptom_id, (0.5, 0.5))
            new_code = f"R{next_num:03d}"
            next_num += 1
            symptom_ids_blob = pickle.dumps([symptom_id])
            conn.execute(
                sa.text(
                    "INSERT INTO rules "
                    "(rule_code, disease_id, symptom_id, mb, md, symptom_ids, is_active, created_at, updated_at) "
                    "VALUES (:rule_code, :disease_id, :symptom_id, :mb, :md, :symptom_ids, :is_active, :created_at, :updated_at)"
                ),
                {
                    "rule_code": new_code,
                    "disease_id": disease_id,
                    "symptom_id": symptom_id,
                    "mb": mb,
                    "md": md,
                    "symptom_ids": symptom_ids_blob,
                    "is_active": is_active,
                    "created_at": created_at,
                    "updated_at": updated_at
                }
            )


def downgrade():
    # Downgrade is destructive for expanded rules; keep columns for safety
    with op.batch_alter_table('diagnosis_history', schema=None) as batch_op:
        batch_op.drop_column('diagnosis_results')

    with op.batch_alter_table('rules', schema=None) as batch_op:
        batch_op.drop_column('md')
        batch_op.drop_column('mb')
        batch_op.drop_column('symptom_id')

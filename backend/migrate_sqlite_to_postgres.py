#!/usr/bin/env python3
"""
Migrate data from local SQLite DB to Postgres.

Usage (inside backend container):
  SQLITE_PATH=/app/instance/pakar_padi.db python migrate_sqlite_to_postgres.py
"""

import os
import sqlite3
import psycopg


TABLE_ORDER = [
    "users",
    "diseases",
    "symptoms",
    "rules",
    "diagnosis_history",
    "admin_logs",
    "system_settings",
]

BOOLEAN_COLUMNS = {
    "users": {"is_active"},
    "rules": {"is_active"},
    "diagnosis_history": {"is_saved"},
}


def _get_sqlite_rows(conn, table):
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    cur.execute(f'SELECT * FROM "{table}"')
    rows = cur.fetchall()
    cols = [desc[0] for desc in cur.description]
    return cols, rows


def _pg_has_rows(conn, table):
    with conn.cursor() as cur:
        cur.execute(f'SELECT 1 FROM "{table}" LIMIT 1')
        return cur.fetchone() is not None


def _pg_set_sequence(conn, table, id_col="id"):
    with conn.cursor() as cur:
        cur.execute("SELECT pg_get_serial_sequence(%s, %s)", (table, id_col))
        seq = cur.fetchone()[0]
        if not seq:
            return
        cur.execute(f'SELECT COALESCE(MAX("{id_col}"), 0) FROM "{table}"')
        max_id = cur.fetchone()[0] or 0
        cur.execute("SELECT setval(%s, %s, %s)", (seq, max_id, True))


def main():
    sqlite_path = os.environ.get("SQLITE_PATH", "/app/instance/pakar_padi.db")
    pg_dsn = os.environ.get("DATABASE_URL")
    if not pg_dsn:
        raise RuntimeError("DATABASE_URL tidak ditemukan di environment.")
    if pg_dsn.startswith("postgresql+psycopg://"):
        pg_dsn = "postgresql://" + pg_dsn.split("://", 1)[1]
    if not os.path.exists(sqlite_path):
        raise FileNotFoundError(f"SQLite DB tidak ditemukan: {sqlite_path}")

    reset_target = os.environ.get("RESET_TARGET", "false").lower() == "true"

    sqlite_conn = sqlite3.connect(sqlite_path)
    pg_conn = psycopg.connect(pg_dsn)
    pg_conn.execute("SET client_min_messages TO WARNING;")

    try:
        # Safety check
        if not reset_target:
            for table in TABLE_ORDER:
                if _pg_has_rows(pg_conn, table):
                    raise RuntimeError(
                        f'Tabel "{table}" di Postgres sudah berisi data. '
                        "Set RESET_TARGET=true jika ingin menimpa."
                    )

        if reset_target:
            with pg_conn.cursor() as cur:
                for table in reversed(TABLE_ORDER):
                    cur.execute(f'TRUNCATE TABLE "{table}" RESTART IDENTITY CASCADE')

        with pg_conn.cursor() as cur:
            for table in TABLE_ORDER:
                cols, rows = _get_sqlite_rows(sqlite_conn, table)
                if not rows:
                    continue
                print(f"{table}: {len(rows)} rows")
                rows = [list(row) for row in rows]
                bool_cols = BOOLEAN_COLUMNS.get(table, set())
                if bool_cols:
                    bool_idx = [i for i, c in enumerate(cols) if c in bool_cols]
                    for row in rows:
                        for i in bool_idx:
                            if row[i] is not None:
                                row[i] = bool(row[i])
                placeholders = ",".join(["%s"] * len(cols))
                col_list = ",".join([f'"{c}"' for c in cols])
                insert_sql = f'INSERT INTO "{table}" ({col_list}) VALUES ({placeholders})'
                cur.executemany(insert_sql, rows)
        pg_conn.commit()

        for table in TABLE_ORDER:
            _pg_set_sequence(pg_conn, table)
        pg_conn.commit()

        print("Migrasi selesai.")
    finally:
        sqlite_conn.close()
        pg_conn.close()


if __name__ == "__main__":
    main()

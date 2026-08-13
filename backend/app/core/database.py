"""
backend/app/core/database.py

Lightweight stateful SQLite database engine for LegalAid v2.
Handles cases, messages, and audit logs with PII masking.
"""
import os
import sqlite3
import json
import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

from backend.app.core.security import mask_pii_for_logging

DB_PATH = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "data", "legalaid.db")
)

logger = logging.getLogger("legalaid.database")


def get_connection():
    """Returns a connection to the SQLite database with row factory enabled."""
    try:
        os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        return conn
    except Exception as e:
        logger.error("Failed to establish SQLite database connection: %s", e)
        raise RuntimeError(f"Database connection failed: {e}") from e


def init_db():
    """Initialise database schema."""
    try:
        conn = get_connection()
        cursor = conn.cursor()

        # Cases table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS cases (
                id TEXT PRIMARY KEY,
                status TEXT DEFAULT 'intake',
                language TEXT DEFAULT 'English',
                domain TEXT,
                issue TEXT,
                case_summary TEXT,
                facts TEXT DEFAULT '[]', -- JSON list
                missing_facts TEXT DEFAULT '[]', -- JSON list
                clarifying_questions TEXT DEFAULT '[]', -- JSON list
                contradictions TEXT DEFAULT '[]', -- JSON list
                risk_level TEXT DEFAULT 'low',
                safety_alert TEXT,
                professional_review_recommended INTEGER DEFAULT 0,
                helplines TEXT DEFAULT '[]', -- JSON list
                jurisdiction TEXT DEFAULT '{}', -- JSON dict
                legal_regime TEXT,
                temporal_notes TEXT,
                evidence_needed TEXT DEFAULT '[]', -- JSON list
                evidence_nice_to_have TEXT DEFAULT '[]', -- JSON list
                confidence_level TEXT DEFAULT 'needs_verification',
                confidence_reason TEXT,
                rendered_document TEXT,
                verified_sections TEXT DEFAULT '[]', -- JSON list
                rights TEXT DEFAULT '[]', -- JSON list
                applicable_laws TEXT DEFAULT '[]', -- JSON list
                next_steps TEXT DEFAULT '[]', -- JSON list
                remedy TEXT,
                disclaimer TEXT,
                created_at TEXT,
                updated_at TEXT
            )
        """)

        # Messages table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                case_id TEXT,
                sender TEXT, -- 'user' or 'assistant'
                content TEXT,
                timestamp TEXT,
                FOREIGN KEY(case_id) REFERENCES cases(id) ON DELETE CASCADE
            )
        """)

        # Audit logs table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS audit_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT,
                case_id TEXT,
                event_type TEXT, -- e.g. 'PROMPT_INJECTION_DETECTED'
                severity TEXT, -- 'low' | 'medium' | 'high'
                metadata TEXT -- Masked JSON string
            )
        """)

        conn.commit()
        conn.close()
        logger.info("Database schema initialized successfully.")
    except Exception as e:
        logger.error("Database schema initialization failed: %s", e)
        raise RuntimeError(f"Database initialization failed: {e}") from e


# ── Case operations ──────────────────────────────────────────────────────────

def create_case(case_id: str, language: str = "English", status: str = "intake") -> Dict[str, Any]:
    try:
        conn = get_connection()
        cursor = conn.cursor()
        now = datetime.utcnow().isoformat()
        cursor.execute(
            """
            INSERT INTO cases (id, status, language, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?)
            """,
            (case_id, status, language, now, now)
        )
        conn.commit()
        conn.close()
        return get_case(case_id)
    except Exception as e:
        logger.error("Failed to create case '%s': %s", case_id, e)
        raise RuntimeError(f"Database case creation failed: {e}") from e


def get_case(case_id: str) -> Optional[Dict[str, Any]]:
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM cases WHERE id = ?", (case_id,))
        row = cursor.fetchone()
        conn.close()

        if not row:
            return None

        # Parse JSON fields
        res = dict(row)
        for key in ("facts", "missing_facts", "clarifying_questions", "contradictions", "helplines", "evidence_needed", "evidence_nice_to_have", "verified_sections", "rights", "applicable_laws", "next_steps"):
            try:
                res[key] = json.loads(res.get(key) or "[]")
            except Exception as je:
                logger.warning("Failed to parse JSON field '%s' for case '%s': %s. Using default empty list.", key, case_id, je)
                res[key] = []

        try:
            res["jurisdiction"] = json.loads(res.get("jurisdiction") or "{}")
        except Exception as je:
            logger.warning("Failed to parse jurisdiction JSON for case '%s': %s. Using default empty dict.", case_id, je)
            res["jurisdiction"] = {}

        res["case_id"] = res["id"]
        from backend.app.core.config import settings
        res["disclaimer"] = res.get("disclaimer") or settings.DISCLAIMER
        return res
    except Exception as e:
        logger.error("Failed to retrieve case '%s': %s", case_id, e)
        raise RuntimeError(f"Database case retrieval failed: {e}") from e


def update_case(case_id: str, **kwargs) -> Optional[Dict[str, Any]]:
    try:
        conn = get_connection()
        cursor = conn.cursor()
        now = datetime.utcnow().isoformat()
        kwargs["updated_at"] = now

        # Convert complex objects to JSON strings
        fields = []
        values = []
        for k, v in kwargs.items():
            fields.append(f"{k} = ?")
            if isinstance(v, (list, dict)):
                values.append(json.dumps(v, ensure_ascii=False))
            elif isinstance(v, bool):
                values.append(1 if v else 0)
            else:
                values.append(v)

        values.append(case_id)
        query = f"UPDATE cases SET {', '.join(fields)} WHERE id = ?"
        cursor.execute(query, tuple(values))
        conn.commit()
        conn.close()
        return get_case(case_id)
    except Exception as e:
        logger.error("Failed to update case '%s': %s", case_id, e)
        raise RuntimeError(f"Database case update failed: {e}") from e


# ── Message operations ───────────────────────────────────────────────────────

def add_message(case_id: str, sender: str, content: str) -> None:
    try:
        conn = get_connection()
        cursor = conn.cursor()
        now = datetime.utcnow().isoformat()
        # Mask PII in messages before storing to be extra safe
        masked_content = mask_pii_for_logging(content)
        cursor.execute(
            """
            INSERT INTO messages (case_id, sender, content, timestamp)
            VALUES (?, ?, ?, ?)
            """,
            (case_id, sender, masked_content, now)
        )
        conn.commit()
        conn.close()
    except Exception as e:
        logger.error("Failed to add message to case '%s': %s", case_id, e)
        raise RuntimeError(f"Database message creation failed: {e}") from e


def get_messages(case_id: str) -> List[Dict[str, Any]]:
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(
            "SELECT sender, content, timestamp FROM messages WHERE case_id = ? ORDER BY id ASC",
            (case_id,)
        )
        rows = cursor.fetchall()
        conn.close()
        return [dict(r) for r in rows]
    except Exception as e:
        logger.error("Failed to retrieve messages for case '%s': %s", case_id, e)
        raise RuntimeError(f"Database message retrieval failed: {e}") from e


# ── Audit log operations ─────────────────────────────────────────────────────

def add_audit_log(case_id: Optional[str], event_type: str, severity: str, metadata: Any) -> None:
    try:
        conn = get_connection()
        cursor = conn.cursor()
        now = datetime.utcnow().isoformat()

        # Mask PII in metadata before writing to log
        meta_str = ""
        if metadata:
            try:
                if isinstance(metadata, (list, dict)):
                    meta_str = json.dumps(metadata, ensure_ascii=False)
                else:
                    meta_str = str(metadata)
            except Exception as je:
                meta_str = f"Error serializing metadata: {je}"
            meta_str = mask_pii_for_logging(meta_str)

        cursor.execute(
            """
            INSERT INTO audit_logs (timestamp, case_id, event_type, severity, metadata)
            VALUES (?, ?, ?, ?, ?)
            """,
            (now, case_id, event_type, severity, meta_str)
        )
        conn.commit()
        conn.close()
    except Exception as e:
        logger.error("Failed to add audit log for case '%s': %s", case_id, e)
        # Fail silently for audit logs so logging errors don't crash core user transactions


def get_audit_logs(case_id: Optional[str] = None) -> List[Dict[str, Any]]:
    try:
        conn = get_connection()
        cursor = conn.cursor()
        if case_id:
            cursor.execute(
                "SELECT * FROM audit_logs WHERE case_id = ? ORDER BY id DESC",
                (case_id,)
            )
        else:
            cursor.execute("SELECT * FROM audit_logs ORDER BY id DESC")
        rows = cursor.fetchall()
        conn.close()
        return [dict(r) for r in rows]
    except Exception as e:
        logger.error("Failed to retrieve audit logs: %s", e)
        raise RuntimeError(f"Database audit log retrieval failed: {e}") from e

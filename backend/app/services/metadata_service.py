from app.config import settings
from app.db import connect, rows_to_dict
from app.cache import cached


class MetadataService:
    @cached(ttl=600, key_prefix="metadata")
    def list_tables(self) -> list[str]:
        """列出所有表（缓存10分钟）"""
        with connect(settings.equipment_db) as conn:
            rows = conn.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").fetchall()
            return [r[0] for r in rows]

    @cached(ttl=600, key_prefix="metadata")
    def describe_table(self, table_name: str) -> list[dict]:
        """获取表字段信息（缓存10分钟）"""
        with connect(settings.equipment_db) as conn:
            rows = conn.execute(f"PRAGMA table_info({table_name})").fetchall()
            return rows_to_dict(rows)

    @cached(ttl=60, key_prefix="metadata")
    def sample_table(self, table_name: str, limit: int = 5) -> list[dict]:
        """获取样例数据（缓存1分钟）"""
        with connect(settings.equipment_db) as conn:
            rows = conn.execute(f"SELECT * FROM {table_name} LIMIT ?", (limit,)).fetchall()
            return rows_to_dict(rows)

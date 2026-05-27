from app.config import settings
from app.db import connect, rows_to_dict
from app.cache import cached


class DataSourceService:
    @cached(ttl=300, key_prefix="datasource")
    def list_datasources(self) -> list[dict]:
        """列出数据源（缓存5分钟）"""
        with connect(settings.platform_db) as conn:
            rows = conn.execute("SELECT * FROM datasources ORDER BY id").fetchall()
            return rows_to_dict(rows)

    @cached(ttl=300, key_prefix="datasource")
    def get_datasource(self, datasource_id: int) -> dict | None:
        """获取数据源详情（缓存5分钟）"""
        with connect(settings.platform_db) as conn:
            row = conn.execute("SELECT * FROM datasources WHERE id=?", (datasource_id,)).fetchone()
            return dict(row) if row else None

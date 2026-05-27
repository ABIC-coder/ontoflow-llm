import json
import sqlite3
from pathlib import Path
from typing import Any

# 导入连接池
from app.db_pool import get_pool, rows_to_dict


def connect(db_path: Path) -> sqlite3.Connection:
    """获取数据库连接（兼容旧接口）"""
    pool = get_pool(db_path)
    # 返回一个包装器，支持with语句
    return _ConnectionContext(pool)


class _ConnectionContext:
    """连接上下文包装器"""
    
    def __init__(self, pool):
        self._pool = pool
        self._conn = None
    
    def __enter__(self):
        self._ctx = self._pool.get_connection()
        self._conn = self._ctx.__enter__()
        return self._conn
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        return self._ctx.__exit__(exc_type, exc_val, exc_tb)
    
    def execute(self, *args, **kwargs):
        if self._conn is None:
            raise RuntimeError("Connection not established. Use with statement.")
        return self._conn.execute(*args, **kwargs)
    
    def executemany(self, *args, **kwargs):
        if self._conn is None:
            raise RuntimeError("Connection not established. Use with statement.")
        return self._conn.executemany(*args, **kwargs)
    
    def commit(self):
        if self._conn:
            self._conn.commit()


def json_dumps(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False)

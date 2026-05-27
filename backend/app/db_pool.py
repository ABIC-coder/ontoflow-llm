"""
数据库连接池 - 复用连接提高性能
"""
import sqlite3
import threading
from pathlib import Path
from typing import Optional
from contextlib import contextmanager

class ConnectionPool:
    """SQLite连接池"""
    
    def __init__(self, db_path: Path, max_connections: int = 5):
        self.db_path = db_path
        self.max_connections = max_connections
        self._pool: list[sqlite3.Connection] = []
        self._lock = threading.Lock()
        self._in_use = 0
    
    def _create_connection(self) -> sqlite3.Connection:
        """创建新连接"""
        conn = sqlite3.connect(str(self.db_path), check_same_thread=False)
        conn.row_factory = sqlite3.Row
        # 启用WAL模式提高并发性能
        conn.execute("PRAGMA journal_mode=WAL")
        # 增加缓存大小
        conn.execute("PRAGMA cache_size=-64000")  # 64MB
        # 启用内存映射
        conn.execute("PRAGMA mmap_size=67108864")  # 64MB
        return conn
    
    @contextmanager
    def get_connection(self):
        """获取连接（上下文管理器）"""
        conn = None
        with self._lock:
            if self._pool:
                conn = self._pool.pop()
            elif self._in_use < self.max_connections:
                conn = self._create_connection()
                self._in_use += 1
        
        if conn is None:
            # 如果连接池满了，创建临时连接
            conn = self._create_connection()
            temp = True
        else:
            temp = False
        
        try:
            yield conn
        finally:
            if temp:
                conn.close()
            else:
                with self._lock:
                    self._pool.append(conn)
    
    def close_all(self):
        """关闭所有连接"""
        with self._lock:
            for conn in self._pool:
                conn.close()
            self._pool.clear()
            self._in_use = 0


# 全局连接池
_pools: dict[str, ConnectionPool] = {}
_lock = threading.Lock()


def get_pool(db_path: Path) -> ConnectionPool:
    """获取或创建连接池"""
    key = str(db_path)
    with _lock:
        if key not in _pools:
            _pools[key] = ConnectionPool(db_path)
        return _pools[key]


def connect(db_path: Path):
    """获取数据库连接（兼容旧代码）"""
    return get_pool(db_path).get_connection()


def rows_to_dict(rows: list[sqlite3.Row]) -> list[dict]:
    """将Row转换为dict"""
    return [dict(r) for r in rows]

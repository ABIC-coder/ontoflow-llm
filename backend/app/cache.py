"""
简单缓存 - 用于缓存不常变化的数据
"""
import time
import threading
from typing import Any, Optional
from functools import wraps


class SimpleCache:
    """简单内存缓存"""
    
    def __init__(self, default_ttl: int = 60):
        """
        初始化缓存
        default_ttl: 默认缓存时间（秒）
        """
        self._cache: dict[str, tuple[Any, float]] = {}
        self._lock = threading.Lock()
        self.default_ttl = default_ttl
    
    def get(self, key: str) -> Optional[Any]:
        """获取缓存"""
        with self._lock:
            if key in self._cache:
                value, expire_time = self._cache[key]
                if time.time() < expire_time:
                    return value
                else:
                    del self._cache[key]
        return None
    
    def set(self, key: str, value: Any, ttl: int = None):
        """设置缓存"""
        ttl = ttl or self.default_ttl
        with self._lock:
            self._cache[key] = (value, time.time() + ttl)
    
    def delete(self, key: str):
        """删除缓存"""
        with self._lock:
            self._cache.pop(key, None)
    
    def clear(self):
        """清空缓存"""
        with self._lock:
            self._cache.clear()
    
    def cleanup(self):
        """清理过期缓存"""
        now = time.time()
        with self._lock:
            expired_keys = [k for k, (_, exp) in self._cache.items() if now >= exp]
            for k in expired_keys:
                del self._cache[k]


# 全局缓存实例
cache = SimpleCache(default_ttl=300)  # 5分钟默认TTL


def cached(ttl: int = None, key_prefix: str = ""):
    """
    缓存装饰器
    ttl: 缓存时间（秒）
    key_prefix: 缓存键前缀
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # 生成缓存键
            cache_key = f"{key_prefix}:{func.__name__}:{str(args)}:{str(kwargs)}"
            
            # 尝试从缓存获取
            result = cache.get(cache_key)
            if result is not None:
                return result
            
            # 执行函数
            result = func(*args, **kwargs)
            
            # 存入缓存
            cache.set(cache_key, result, ttl)
            
            return result
        return wrapper
    return decorator

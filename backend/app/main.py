import logging
import threading
import time
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.bootstrap import ensure_runtime_ready
from app.logging_config import setup_logging
from app.api.datasource_api import router as datasource_router
from app.api.metadata_api import router as metadata_router
from app.api.ontology_api import router as ontology_router
from app.api.graph_api import router as graph_router
from app.api.chat_api import router as chat_router
from app.cache import cache

app = FastAPI(title="Mini OntoFlow - 设备全生命周期管理平台")
logger = logging.getLogger(__name__)

setup_logging()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5173", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get('/api/health')
def health(): return {"status":"ok", "version": "2.0"}

app.include_router(datasource_router)
app.include_router(metadata_router)
app.include_router(ontology_router)
app.include_router(graph_router)
app.include_router(chat_router)


def _cache_cleanup_task():
    """缓存清理任务"""
    while True:
        try:
            time.sleep(60)  # 每分钟清理一次
            cache.cleanup()
        except Exception as e:
            logger.error(f"缓存清理失败: {e}")


@app.on_event("startup")
def startup_init() -> None:
    logger.info("Starting backend service...")
    ensure_runtime_ready()
    
    # 启动缓存清理线程
    cleanup_thread = threading.Thread(target=_cache_cleanup_task, daemon=True)
    cleanup_thread.start()
    
    logger.info("Runtime bootstrap completed.")

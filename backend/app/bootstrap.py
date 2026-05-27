"""
本体驱动的图谱构建引擎 v2
根据本体定义自动构建知识图谱，支持增量同步
"""
from __future__ import annotations

import json
import sqlite3
import hashlib
import logging
import threading
from datetime import datetime
from pathlib import Path
from typing import Any

from app.config import settings

logger = logging.getLogger(__name__)

# 启动状态锁
_startup_lock = threading.Lock()
_startup_done = False


class OntologyDrivenGraphBuilder:
    """本体驱动的图谱构建器"""

    def __init__(self, ontology_path: Path | None = None):
        self.ontology_path = ontology_path or settings.ontology_seed_path
        self.ontology = self._load_ontology()
        self._node_cache: dict[tuple[str, int], int] = {}

    def _load_ontology(self) -> dict:
        """加载本体定义"""
        with open(self.ontology_path, 'r', encoding='utf-8') as f:
            return json.load(f)

    def _get_entity_config(self, entity_type: str) -> dict | None:
        """获取实体配置"""
        for entity in self.ontology.get('entities', []):
            if entity['type'] == entity_type:
                return entity
        return None

    def _get_relation_config(self, relation_label: str) -> dict | None:
        """获取关系配置"""
        for rel in self.ontology.get('relations', []):
            if rel['label'] == relation_label:
                return rel
        return None

    def build_full(self) -> dict:
        """全量构建图谱"""
        logger.info("开始全量构建图谱...")
        start_time = datetime.now()

        with sqlite3.connect(settings.equipment_db) as src, \
             sqlite3.connect(settings.platform_db) as dst:
            src.row_factory = sqlite3.Row
            dst.row_factory = sqlite3.Row

            # 清空图谱
            dst.execute("DELETE FROM graph_edges")
            dst.execute("DELETE FROM graph_nodes")
            self._node_cache.clear()

            # 构建节点
            node_count = self._build_all_nodes(src, dst)

            # 构建边
            edge_count = self._build_all_edges(src, dst)

            dst.commit()

        elapsed = (datetime.now() - start_time).total_seconds()
        result = {
            "node_count": node_count,
            "edge_count": edge_count,
            "elapsed_seconds": elapsed
        }
        logger.info(f"图谱构建完成: {result}")
        return result

    def _build_all_nodes(self, src: sqlite3.Connection, dst: sqlite3.Connection) -> int:
        """根据本体定义构建所有节点"""
        count = 0
        for entity_config in self.ontology.get('entities', []):
            entity_type = entity_config['type']
            source_table = entity_config.get('source_table')
            label_expr = entity_config.get('label_expr', 'name')
            prop_mappings = entity_config.get('property_mappings', {})

            if not source_table:
                continue

            try:
                rows = src.execute(f"SELECT * FROM {source_table}").fetchall()
            except sqlite3.OperationalError as e:
                logger.warning(f"表 {source_table} 不存在: {e}")
                continue

            for row in rows:
                row_dict = dict(row)
                # 计算label
                label = str(row_dict.get(label_expr, f"{entity_type}-{row_dict.get('id', '?')}"))

                # 构建属性JSON
                properties = {}
                if prop_mappings:
                    for prop_name, col_name in prop_mappings.items():
                        if col_name in row_dict:
                            properties[prop_name] = row_dict[col_name]
                else:
                    properties = row_dict

                # 计算数据哈希用于增量同步
                data_hash = hashlib.md5(
                    json.dumps(properties, sort_keys=True, default=str).encode()
                ).hexdigest()

                cur = dst.execute(
                    """INSERT INTO graph_nodes
                       (entity_type, source_table, source_id, label, properties_json, data_hash)
                       VALUES (?, ?, ?, ?, ?, ?)""",
                    (entity_type, source_table, row_dict['id'], label,
                     json.dumps(properties, ensure_ascii=False), data_hash)
                )
                self._node_cache[(source_table, row_dict['id'])] = cur.lastrowid
                count += 1

        logger.info(f"构建节点完成: {count} 个")
        return count

    def _build_all_edges(self, src: sqlite3.Connection, dst: sqlite3.Connection) -> int:
        """根据本体定义构建所有边"""
        count = 0
        for rel_config in self.ontology.get('relations', []):
            relation_type = rel_config['label']
            source_type = rel_config['source']
            target_type = rel_config['target']
            join_type = rel_config.get('join_type', 'direct')

            if join_type == 'direct':
                count += self._build_direct_edges(src, dst, rel_config)
            elif join_type == 'indirect':
                count += self._build_indirect_edges(src, dst, rel_config)

        logger.info(f"构建边完成: {count} 条")
        return count

    def _build_direct_edges(self, src: sqlite3.Connection, dst: sqlite3.Connection,
                            rel_config: dict) -> int:
        """构建直接关联的边（通过外键）"""
        count = 0
        relation_type = rel_config['label']
        join_config = rel_config.get('join', {})
        source_field = join_config.get('source_field')
        target_field = join_config.get('target_field')
        skip_null = join_config.get('skip_null', False)

        source_entity = self._get_entity_config(rel_config['source'])
        target_entity = self._get_entity_config(rel_config['target'])

        if not source_entity or not target_entity:
            return 0

        source_table = source_entity.get('source_table')
        target_table = target_entity.get('source_table')

        if not source_table or not target_table:
            return 0

        try:
            rows = src.execute(f"SELECT * FROM {source_table}").fetchall()
        except sqlite3.OperationalError:
            return 0

        for row in rows:
            row_dict = dict(row)
            source_id = row_dict.get('id')
            target_id = row_dict.get(source_field)

            if skip_null and target_id is None:
                continue

            if target_id is None:
                continue

            source_node_id = self._node_cache.get((source_table, source_id))
            target_node_id = self._node_cache.get((target_table, target_id))

            if source_node_id and target_node_id:
                dst.execute(
                    """INSERT INTO graph_edges
                       (source_node_id, target_node_id, relation_type, properties_json)
                       VALUES (?, ?, ?, ?)""",
                    (source_node_id, target_node_id, relation_type, '{}')
                )
                count += 1

        return count

    def _build_indirect_edges(self, src: sqlite3.Connection, dst: sqlite3.Connection,
                              rel_config: dict) -> int:
        """构建间接关联的边（通过中间表）"""
        count = 0
        relation_type = rel_config['label']
        through_table = rel_config.get('through')
        through_join = rel_config.get('through_join', {})
        source_field = through_join.get('source_field')
        target_field = through_join.get('target_field')

        source_entity = self._get_entity_config(rel_config['source'])
        target_entity = self._get_entity_config(rel_config['target'])

        if not source_entity or not target_entity or not through_table:
            return 0

        source_table = source_entity.get('source_table')
        target_table = target_entity.get('source_table')

        if not source_table or not target_table:
            return 0

        try:
            rows = src.execute(f"SELECT * FROM {through_table}").fetchall()
        except sqlite3.OperationalError:
            return 0

        for row in rows:
            row_dict = dict(row)
            source_id = row_dict.get(source_field)
            target_id = row_dict.get(target_field)

            if source_id is None or target_id is None:
                continue

            source_node_id = self._node_cache.get((source_table, source_id))
            target_node_id = self._node_cache.get((target_table, target_id))

            if source_node_id and target_node_id:
                dst.execute(
                    """INSERT INTO graph_edges
                       (source_node_id, target_node_id, relation_type, properties_json)
                       VALUES (?, ?, ?, ?)""",
                    (source_node_id, target_node_id, relation_type, '{}')
                )
                count += 1

        return count

    def incremental_sync(self) -> dict:
        """增量同步：只更新变更的数据"""
        logger.info("开始增量同步...")
        start_time = datetime.now()

        with sqlite3.connect(settings.equipment_db) as src, \
             sqlite3.connect(settings.platform_db) as dst:
            src.row_factory = sqlite3.Row
            dst.row_factory = sqlite3.Row

            # 加载现有节点缓存
            self._load_node_cache(dst)

            new_nodes = 0
            updated_nodes = 0
            new_edges = 0

            # 检查并更新节点
            for entity_config in self.ontology.get('entities', []):
                n_new, n_updated = self._sync_entity_nodes(src, dst, entity_config)
                new_nodes += n_new
                updated_nodes += n_updated

            # 重建所有边（边的关系可能变化）
            dst.execute("DELETE FROM graph_edges")
            new_edges = self._build_all_edges(src, dst)

            dst.commit()

        elapsed = (datetime.now() - start_time).total_seconds()
        result = {
            "new_nodes": new_nodes,
            "updated_nodes": updated_nodes,
            "new_edges": new_edges,
            "elapsed_seconds": elapsed
        }
        logger.info(f"增量同步完成: {result}")
        return result

    def _load_node_cache(self, dst: sqlite3.Connection) -> None:
        """从数据库加载节点缓存"""
        self._node_cache.clear()
        rows = dst.execute(
            "SELECT id, entity_type, source_table, source_id FROM graph_nodes"
        ).fetchall()
        for row in rows:
            # 需要反向查找source_table
            for entity in self.ontology.get('entities', []):
                if entity['type'] == row[1]:
                    self._node_cache[(entity.get('source_table'), row[3])] = row[0]
                    break

    def _sync_entity_nodes(self, src: sqlite3.Connection, dst: sqlite3.Connection,
                           entity_config: dict) -> tuple[int, int]:
        """同步单个实体类型的节点"""
        new_count = 0
        updated_count = 0

        entity_type = entity_config['type']
        source_table = entity_config.get('source_table')
        label_expr = entity_config.get('label_expr', 'name')
        prop_mappings = entity_config.get('property_mappings', {})

        if not source_table:
            return 0, 0

        try:
            rows = src.execute(f"SELECT * FROM {source_table}").fetchall()
        except sqlite3.OperationalError:
            return 0, 0

        for row in rows:
            row_dict = dict(row)
            source_id = row_dict['id']

            # 计算属性和哈希
            properties = {}
            if prop_mappings:
                for prop_name, col_name in prop_mappings.items():
                    if col_name in row_dict:
                        properties[prop_name] = row_dict[col_name]
            else:
                properties = row_dict

            label = str(row_dict.get(label_expr, f"{entity_type}-{source_id}"))
            data_hash = hashlib.md5(
                json.dumps(properties, sort_keys=True, default=str).encode()
            ).hexdigest()

            existing_node_id = self._node_cache.get((source_table, source_id))

            if existing_node_id:
                # 检查是否需要更新
                existing = dst.execute(
                    "SELECT data_hash FROM graph_nodes WHERE id=?",
                    (existing_node_id,)
                ).fetchone()

                if existing and existing[0] != data_hash:
                    # 更新节点
                    dst.execute(
                        """UPDATE graph_nodes
                           SET label=?, properties_json=?, data_hash=?, updated_at=?
                           WHERE id=?""",
                        (label, json.dumps(properties, ensure_ascii=False),
                         data_hash, datetime.now().isoformat(), existing_node_id)
                    )
                    updated_count += 1
            else:
                # 新增节点
                cur = dst.execute(
                    """INSERT INTO graph_nodes
                       (entity_type, source_table, source_id, label, properties_json, data_hash)
                       VALUES (?, ?, ?, ?, ?, ?)""",
                    (entity_type, source_table, source_id, label,
                     json.dumps(properties, ensure_ascii=False), data_hash)
                )
                self._node_cache[(source_table, source_id)] = cur.lastrowid
                new_count += 1

        return new_count, updated_count


def init_demo_databases() -> None:
    """创建/重置演示数据库"""
    settings.data_dir.mkdir(exist_ok=True)
    from scripts.init_demo_db_v2 import init_equipment_db
    init_equipment_db(settings.equipment_db)
    _init_platform_db()


def _init_platform_db() -> None:
    """初始化平台数据库"""
    with sqlite3.connect(settings.platform_db) as c:
        c.executescript("""
            CREATE TABLE IF NOT EXISTS datasources (
                id INTEGER PRIMARY KEY,
                name TEXT,
                type TEXT,
                db_path TEXT,
                description TEXT
            );

            CREATE TABLE IF NOT EXISTS ontology_schemas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT,
                version TEXT,
                schema_json TEXT,
                created_at TEXT
            );

            CREATE TABLE IF NOT EXISTS graph_nodes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                entity_type TEXT NOT NULL,
                source_table TEXT,
                source_id INTEGER,
                label TEXT NOT NULL,
                properties_json TEXT,
                data_hash TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS graph_edges (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                source_node_id INTEGER NOT NULL,
                target_node_id INTEGER NOT NULL,
                relation_type TEXT NOT NULL,
                properties_json TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (source_node_id) REFERENCES graph_nodes(id),
                FOREIGN KEY (target_node_id) REFERENCES graph_nodes(id)
            );

            CREATE TABLE IF NOT EXISTS sync_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                sync_type TEXT,
                node_count INTEGER,
                edge_count INTEGER,
                new_nodes INTEGER,
                updated_nodes INTEGER,
                status TEXT,
                started_at TEXT,
                completed_at TEXT,
                details TEXT
            );

            CREATE INDEX IF NOT EXISTS idx_graph_nodes_entity_type ON graph_nodes(entity_type);
            CREATE INDEX IF NOT EXISTS idx_graph_nodes_source ON graph_nodes(source_table, source_id);
            CREATE INDEX IF NOT EXISTS idx_graph_nodes_label ON graph_nodes(label);
            CREATE INDEX IF NOT EXISTS idx_graph_edges_source ON graph_edges(source_node_id);
            CREATE INDEX IF NOT EXISTS idx_graph_edges_target ON graph_edges(target_node_id);
            CREATE INDEX IF NOT EXISTS idx_graph_edges_type ON graph_edges(relation_type);

            DELETE FROM datasources;
        """)

        c.execute(
            "INSERT INTO datasources(id,name,type,db_path,description) VALUES(1,?,?,?,?)",
            ("equipment_demo", "sqlite", str(settings.equipment_db), "设备全生命周期管理演示库")
        )

        # 保存本体定义
        ontology_path = settings.ontology_seed_path
        if ontology_path.exists():
            schema_json = ontology_path.read_text(encoding='utf-8')
            schema_data = json.loads(schema_json)
            c.execute(
                "INSERT INTO ontology_schemas(name,version,schema_json,created_at) VALUES(?,?,?,?)",
                (schema_data.get('name', 'unknown'),
                 schema_data.get('version', '1.0'),
                 schema_json,
                 datetime.now().isoformat())
            )

        c.commit()


def build_graph() -> dict:
    """全量构建图谱"""
    builder = OntologyDrivenGraphBuilder()
    return builder.build_full()


def incremental_sync() -> dict:
    """增量同步图谱"""
    builder = OntologyDrivenGraphBuilder()
    return builder.incremental_sync()


def ensure_runtime_ready() -> None:
    """确保运行时就绪（非阻塞）"""
    global _startup_done
    
    # 快速检查是否已初始化
    if _startup_done:
        return
    
    # 使用锁避免重复初始化
    with _startup_lock:
        if _startup_done:
            return
        
        if not settings.equipment_db.exists() or not settings.platform_db.exists():
            logger.info("首次启动，初始化数据库...")
            init_demo_databases()
            # 异步构建图谱，不阻塞启动
            threading.Thread(target=_build_graph_async, daemon=True).start()
        else:
            # 检查图谱是否为空，如果是则异步构建
            try:
                with sqlite3.connect(settings.platform_db) as conn:
                    count = conn.execute("SELECT COUNT(*) FROM graph_nodes").fetchone()[0]
                    if count == 0:
                        logger.info("图谱为空，异步构建...")
                        threading.Thread(target=_build_graph_async, daemon=True).start()
            except Exception as e:
                logger.warning(f"检查图谱状态失败: {e}")
        
        _startup_done = True


def _build_graph_async():
    """异步构建图谱"""
    try:
        result = build_graph()
        logger.info(f"图谱异步构建完成: {result}")
    except Exception as e:
        logger.error(f"图谱异步构建失败: {e}")


def rebuild_graph() -> dict:
    """重建图谱（管理员操作）"""
    logger.info("手动触发重建图谱...")
    return build_graph()

"""
高级图谱查询服务
支持路径查找、子图匹配、多跳查询、图谱推理
"""
import json
import logging
from collections import deque
from typing import Any
from app.config import settings
from app.db import connect, rows_to_dict
from app.cache import cached

logger = logging.getLogger(__name__)


class AdvancedGraphQuery:
    """高级图谱查询服务"""

    def __init__(self):
        pass

    # ==================== 基础查询 ====================

    @cached(ttl=60, key_prefix="graph")
    def stats(self) -> dict:
        """图谱统计（缓存1分钟）"""
        with connect(settings.platform_db) as conn:
            node_count = conn.execute("SELECT COUNT(*) FROM graph_nodes").fetchone()[0]
            edge_count = conn.execute("SELECT COUNT(*) FROM graph_edges").fetchone()[0]
            entity_types = conn.execute(
                "SELECT entity_type, COUNT(*) cnt FROM graph_nodes GROUP BY entity_type"
            ).fetchall()
            relation_types = conn.execute(
                "SELECT relation_type, COUNT(*) cnt FROM graph_edges GROUP BY relation_type"
            ).fetchall()

            return {
                "node_count": node_count,
                "edge_count": edge_count,
                "entity_types": {r[0]: r[1] for r in entity_types},
                "relation_types": {r[0]: r[1] for r in relation_types}
            }

    def list_nodes(self, entity_type: str = None, limit: int = 200) -> list[dict]:
        """列出节点"""
        with connect(settings.platform_db) as conn:
            if entity_type:
                rows = conn.execute(
                    "SELECT * FROM graph_nodes WHERE entity_type=? ORDER BY id LIMIT ?",
                    (entity_type, limit)
                ).fetchall()
            else:
                rows = conn.execute(
                    "SELECT * FROM graph_nodes ORDER BY id LIMIT ?", (limit,)
                ).fetchall()
            return rows_to_dict(rows)

    def list_edges(self, relation_type: str = None, limit: int = 300) -> list[dict]:
        """列出边"""
        with connect(settings.platform_db) as conn:
            if relation_type:
                rows = conn.execute(
                    "SELECT * FROM graph_edges WHERE relation_type=? ORDER BY id LIMIT ?",
                    (relation_type, limit)
                ).fetchall()
            else:
                rows = conn.execute(
                    "SELECT * FROM graph_edges ORDER BY id LIMIT ?", (limit,)
                ).fetchall()
            return rows_to_dict(rows)

    def get_entity(self, node_id: int) -> dict | None:
        """获取单个节点详情"""
        with connect(settings.platform_db) as conn:
            row = conn.execute("SELECT * FROM graph_nodes WHERE id=?", (node_id,)).fetchone()
            if row:
                result = dict(row)
                # 解析属性
                if result.get('properties_json'):
                    result['properties'] = json.loads(result['properties_json'])
                return result
            return None

    def search(self, keyword: str, entity_type: str = None, limit: int = 50) -> list[dict]:
        """搜索节点"""
        kw = f"%{keyword}%"
        with connect(settings.platform_db) as conn:
            if entity_type:
                rows = conn.execute(
                    """SELECT * FROM graph_nodes
                       WHERE (label LIKE ? OR properties_json LIKE ?) AND entity_type=?
                       LIMIT ?""",
                    (kw, kw, entity_type, limit)
                ).fetchall()
            else:
                rows = conn.execute(
                    "SELECT * FROM graph_nodes WHERE label LIKE ? OR properties_json LIKE ? LIMIT ?",
                    (kw, kw, limit)
                ).fetchall()
            return rows_to_dict(rows)

    # ==================== 邻居查询 ====================

    def get_neighbors(self, node_id: int, direction: str = "both", depth: int = 1) -> dict:
        """获取邻居节点（支持多跳）"""
        if depth < 1:
            depth = 1
        if depth > 5:
            depth = 5  # 限制最大深度

        visited = set()
        result_nodes = []
        result_edges = []
        queue = deque([(node_id, 0)])

        while queue:
            current_id, current_depth = queue.popleft()

            if current_id in visited or current_depth > depth:
                continue
            visited.add(current_id)

            if current_depth > 0:
                node = self.get_entity(current_id)
                if node:
                    node['depth'] = current_depth
                    result_nodes.append(node)

            # 获取邻居
            neighbors = self._get_direct_neighbors(current_id, direction)
            for neighbor in neighbors:
                neighbor_id = neighbor['node_id']
                if neighbor_id not in visited:
                    result_edges.append({
                        'source_node_id': current_id if direction != 'in' else neighbor_id,
                        'target_node_id': neighbor_id if direction != 'in' else current_id,
                        'relation_type': neighbor['relation_type'],
                        'depth': current_depth
                    })
                    if current_depth < depth:
                        queue.append((neighbor_id, current_depth + 1))

        return {
            "center_node_id": node_id,
            "depth": depth,
            "nodes": result_nodes,
            "edges": result_edges
        }

    def _get_direct_neighbors(self, node_id: int, direction: str = "both") -> list[dict]:
        """获取直接邻居"""
        with connect(settings.platform_db) as conn:
            results = []

            if direction in ("out", "both"):
                out_rows = conn.execute(
                    """SELECT e.relation_type, n.id as node_id, n.entity_type, n.label
                       FROM graph_edges e
                       JOIN graph_nodes n ON n.id = e.target_node_id
                       WHERE e.source_node_id = ?""",
                    (node_id,)
                ).fetchall()
                for row in out_rows:
                    results.append({
                        'relation_type': row[0],
                        'node_id': row[1],
                        'entity_type': row[2],
                        'label': row[3],
                        'direction': 'out'
                    })

            if direction in ("in", "both"):
                in_rows = conn.execute(
                    """SELECT e.relation_type, n.id as node_id, n.entity_type, n.label
                       FROM graph_edges e
                       JOIN graph_nodes n ON n.id = e.source_node_id
                       WHERE e.target_node_id = ?""",
                    (node_id,)
                ).fetchall()
                for row in in_rows:
                    results.append({
                        'relation_type': row[0],
                        'node_id': row[1],
                        'entity_type': row[2],
                        'label': row[3],
                        'direction': 'in'
                    })

            return results

    # ==================== 路径查找 ====================

    def find_path(self, start_id: int, end_id: int, max_depth: int = 6) -> dict:
        """查找两个节点之间的最短路径（BFS）"""
        if start_id == end_id:
            return {"found": True, "path": [start_id], "edges": [], "length": 0}

        visited = {start_id}
        queue = deque([(start_id, [start_id], [])])

        while queue:
            current, path, edges = queue.popleft()

            if len(path) > max_depth:
                continue

            neighbors = self._get_direct_neighbors(current, "both")
            for neighbor in neighbors:
                next_id = neighbor['node_id']

                if next_id == end_id:
                    return {
                        "found": True,
                        "path": path + [next_id],
                        "edges": edges + [{
                            'source': current,
                            'target': next_id,
                            'relation': neighbor['relation_type']
                        }],
                        "length": len(path)
                    }

                if next_id not in visited:
                    visited.add(next_id)
                    queue.append((
                        next_id,
                        path + [next_id],
                        edges + [{
                            'source': current,
                            'target': next_id,
                            'relation': neighbor['relation_type']
                        }]
                    ))

        return {"found": False, "path": [], "edges": [], "length": -1}

    def find_all_paths(self, start_id: int, end_id: int, max_depth: int = 4) -> list[dict]:
        """查找两个节点之间的所有路径（限制深度）"""
        all_paths = []

        def dfs(current, path, edges, visited):
            if len(path) > max_depth:
                return

            if current == end_id and len(path) > 1:
                all_paths.append({
                    "path": list(path),
                    "edges": list(edges),
                    "length": len(path) - 1
                })
                return

            neighbors = self._get_direct_neighbors(current, "both")
            for neighbor in neighbors:
                next_id = neighbor['node_id']
                if next_id not in visited:
                    visited.add(next_id)
                    path.append(next_id)
                    edges.append({
                        'source': current,
                        'target': next_id,
                        'relation': neighbor['relation_type']
                    })
                    dfs(next_id, path, edges, visited)
                    path.pop()
                    edges.pop()
                    visited.remove(next_id)

        dfs(start_id, [start_id], [], {start_id})
        return sorted(all_paths, key=lambda x: x['length'])

    # ==================== 子图匹配 ====================

    def find_subgraph(self, pattern: dict) -> list[dict]:
        """
        子图匹配
        pattern格式: {
            "nodes": [{"id": "n1", "entity_type": "Equipment"}, {"id": "n2", "entity_type": "Supplier"}],
            "edges": [{"source": "n1", "target": "n2", "relation_type": "SUPPLIED_BY"}]
        }
        """
        pattern_nodes = pattern.get('nodes', [])
        pattern_edges = pattern.get('edges', [])

        if not pattern_nodes:
            return []

        # 获取第一个模式节点的候选
        first_pattern = pattern_nodes[0]
        candidates = self.search("", first_pattern.get('entity_type'))

        results = []
        for candidate in candidates:
            matches = self._match_subgraph(pattern_nodes, pattern_edges, 0, {first_pattern['id']: candidate['id']})
            results.extend(matches)

        return results

    def _match_subgraph(self, pattern_nodes: list, pattern_edges: list,
                        node_index: int, current_match: dict) -> list[dict]:
        """递归子图匹配"""
        if node_index >= len(pattern_nodes):
            return [dict(current_match)]

        current_pattern = pattern_nodes[node_index]
        pattern_id = current_pattern['id']

        if pattern_id in current_match:
            return self._match_subgraph(pattern_nodes, pattern_edges, node_index + 1, current_match)

        # 获取已匹配节点的邻居作为候选
        candidates = []
        for edge in pattern_edges:
            if edge['target'] == pattern_id and edge['source'] in current_match:
                source_id = current_match[edge['source']]
                neighbors = self._get_direct_neighbors(source_id, "out")
                for n in neighbors:
                    if n['relation_type'] == edge.get('relation_type'):
                        node = self.get_entity(n['node_id'])
                        if node and node.get('entity_type') == current_pattern.get('entity_type'):
                            candidates.append(n['node_id'])
            elif edge['source'] == pattern_id and edge['target'] in current_match:
                target_id = current_match[edge['target']]
                neighbors = self._get_direct_neighbors(target_id, "in")
                for n in neighbors:
                    if n['relation_type'] == edge.get('relation_type'):
                        node = self.get_entity(n['node_id'])
                        if node and node.get('entity_type') == current_pattern.get('entity_type'):
                            candidates.append(n['node_id'])

        if not candidates:
            return []

        results = []
        for candidate_id in set(candidates):
            current_match[pattern_id] = candidate_id
            sub_results = self._match_subgraph(pattern_nodes, pattern_edges, node_index + 1, current_match)
            results.extend(sub_results)
            del current_match[pattern_id]

        return results

    # ==================== 图谱推理 ====================

    def infer_transitive_relations(self, start_id: int, relation_type: str, max_depth: int = 3) -> list[dict]:
        """推导传递性关系"""
        results = []
        visited = set()
        queue = deque([(start_id, 0)])

        while queue:
            current_id, depth = queue.popleft()

            if current_id in visited or depth > max_depth:
                continue
            visited.add(current_id)

            if depth > 0:
                node = self.get_entity(current_id)
                if node:
                    node['inferred_depth'] = depth
                    results.append(node)

            # 获取指定关系类型的邻居
            neighbors = self._get_direct_neighbors(current_id, "out")
            for neighbor in neighbors:
                if neighbor['relation_type'] == relation_type:
                    queue.append((neighbor['node_id'], depth + 1))

        return results

    def find_related_entities(self, start_id: int, target_entity_type: str, max_depth: int = 3) -> list[dict]:
        """查找关联的指定类型实体"""
        results = []
        visited = set()
        queue = deque([(start_id, 0, [])])

        while queue:
            current_id, depth, path = queue.popleft()

            if current_id in visited or depth > max_depth:
                continue
            visited.add(current_id)

            node = self.get_entity(current_id)
            if not node:
                continue

            if node.get('entity_type') == target_entity_type and current_id != start_id:
                results.append({
                    "node": node,
                    "depth": depth,
                    "path": path + [current_id]
                })

            # 获取邻居
            neighbors = self._get_direct_neighbors(current_id, "both")
            for neighbor in neighbors:
                if neighbor['node_id'] not in visited:
                    queue.append((
                        neighbor['node_id'],
                        depth + 1,
                        path + [current_id]
                    ))

        return sorted(results, key=lambda x: x['depth'])

    # ==================== 业务查询 ====================

    @cached(ttl=30, key_prefix="graph")
    def get_equipment_lifecycle(self, equipment_id: int) -> dict:
        """获取设备全生命周期信息"""
        with connect(settings.platform_db) as conn:
            # 获取设备节点
            eq_node = conn.execute(
                "SELECT * FROM graph_nodes WHERE entity_type='Equipment' AND source_id=?",
                (equipment_id,)
            ).fetchone()

            if not eq_node:
                return {"error": f"设备 {equipment_id} 不存在"}

            eq_dict = dict(eq_node)
            node_id = eq_dict['id']

            # 获取所有关联
            neighbors = self.get_neighbors(node_id, "both", depth=2)

            # 按实体类型分组
            lifecycle = {
                "equipment": eq_dict,
                "procurement": [],  # 采购相关
                "testing": [],      # 试验相关
                "maintenance": [],  # 维修相关
                "supply_chain": []  # 供应链相关
            }

            for node in neighbors['nodes']:
                entity_type = node.get('entity_type', '')
                if entity_type in ('ProcurementPlan', 'TenderProject', 'PurchaseContract', 'AcceptanceRecord'):
                    lifecycle['procurement'].append(node)
                elif entity_type in ('TestProject', 'TestPlan', 'TestData', 'AppraisalConclusion'):
                    lifecycle['testing'].append(node)
                elif entity_type in ('MaintenancePlan', 'MaintenanceOrder', 'FailureMode', 'SparePart'):
                    lifecycle['maintenance'].append(node)
                elif entity_type in ('Supplier', 'Manufacturer', 'Location'):
                    lifecycle['supply_chain'].append(node)

            lifecycle['relations'] = neighbors['edges']
            return lifecycle

    @cached(ttl=30, key_prefix="graph")
    def get_supply_chain(self, equipment_id: int) -> dict:
        """获取设备供应链信息"""
        with connect(settings.platform_db) as conn:
            eq_node = conn.execute(
                "SELECT * FROM graph_nodes WHERE entity_type='Equipment' AND source_id=?",
                (equipment_id,)
            ).fetchone()

            if not eq_node:
                return {"error": f"设备 {equipment_id} 不存在"}

            eq_dict = dict(eq_node)
            node_id = eq_dict['id']

            # 查找供应商、厂家、位置
            supply_chain = {
                "equipment": eq_dict,
                "manufacturer": None,
                "supplier": None,
                "location": None,
                "contracts": []
            }

            neighbors = self._get_direct_neighbors(node_id, "out")
            for neighbor in neighbors:
                node = self.get_entity(neighbor['node_id'])
                if not node:
                    continue

                if neighbor['relation_type'] == 'PRODUCED_BY':
                    supply_chain['manufacturer'] = node
                elif neighbor['relation_type'] == 'SUPPLIED_BY':
                    supply_chain['supplier'] = node
                elif neighbor['relation_type'] == 'LOCATED_IN':
                    supply_chain['location'] = node
                elif neighbor['relation_type'] == 'FOR_EQUIPMENT':
                    supply_chain['contracts'].append(node)

            return supply_chain

    @cached(ttl=30, key_prefix="graph")
    def get_maintenance_history(self, equipment_id: int) -> dict:
        """获取设备维修历史"""
        with connect(settings.platform_db) as conn:
            eq_node = conn.execute(
                "SELECT * FROM graph_nodes WHERE entity_type='Equipment' AND source_id=?",
                (equipment_id,)
            ).fetchone()

            if not eq_node:
                return {"error": f"设备 {equipment_id} 不存在"}

            eq_dict = dict(eq_node)
            node_id = eq_dict['id']

            # 查找维修相关节点
            maintenance = {
                "equipment": eq_dict,
                "plans": [],
                "orders": [],
                "failure_modes": [],
                "spare_parts_used": []
            }

            # 2跳查询获取维修信息
            neighbors = self.get_neighbors(node_id, "out", depth=2)
            for node in neighbors['nodes']:
                entity_type = node.get('entity_type', '')
                if entity_type == 'MaintenancePlan':
                    maintenance['plans'].append(node)
                elif entity_type == 'MaintenanceOrder':
                    maintenance['orders'].append(node)
                elif entity_type == 'FailureMode':
                    maintenance['failure_modes'].append(node)
                elif entity_type == 'SparePart':
                    maintenance['spare_parts_used'].append(node)

            return maintenance

"""
图谱工具 - 高级图谱查询
"""
from app.services.graph_query import AdvancedGraphQuery

_svc = AdvancedGraphQuery()


def search_graph(keyword: str, entity_type: str = None) -> list[dict]:
    """搜索图谱节点"""
    return _svc.search(keyword, entity_type)


def get_entity_neighbors(node_id: int, direction: str = "both", depth: int = 1) -> dict:
    """获取实体邻居（支持多跳）"""
    return _svc.get_neighbors(node_id, direction, depth)


def find_path(start_id: int, end_id: int, max_depth: int = 6) -> dict:
    """查找两个节点之间的最短路径"""
    return _svc.find_path(start_id, end_id, max_depth)


def find_all_paths(start_id: int, end_id: int, max_depth: int = 4) -> list[dict]:
    """查找两个节点之间的所有路径"""
    return _svc.find_all_paths(start_id, end_id, max_depth)


def find_related_entities(start_id: int, target_entity_type: str, max_depth: int = 3) -> list[dict]:
    """查找关联的指定类型实体"""
    return _svc.find_related_entities(start_id, target_entity_type, max_depth)


def infer_transitive_relations(start_id: int, relation_type: str, max_depth: int = 3) -> list[dict]:
    """推导传递性关系"""
    return _svc.infer_transitive_relations(start_id, relation_type, max_depth)


def get_equipment_lifecycle(equipment_id: int) -> dict:
    """获取设备全生命周期信息"""
    return _svc.get_equipment_lifecycle(equipment_id)


def get_supply_chain(equipment_id: int) -> dict:
    """获取设备供应链信息"""
    return _svc.get_supply_chain(equipment_id)


def get_maintenance_history(equipment_id: int) -> dict:
    """获取设备维修历史"""
    return _svc.get_maintenance_history(equipment_id)

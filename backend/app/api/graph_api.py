"""
图谱API - 高级图谱查询接口
"""
from fastapi import APIRouter, HTTPException, Query
from app.services.graph_query import AdvancedGraphQuery
from app.services.rule_engine import EquipmentRiskAnalyzer
from app.bootstrap import incremental_sync, rebuild_graph
from app.tools.equipment_tools import analyze_equipment_risk, analyze_all_equipment, get_risk_summary

router = APIRouter(prefix="/api", tags=["graph"])
gq = AdvancedGraphQuery()
risk_analyzer = EquipmentRiskAnalyzer()


# ==================== 图谱基础接口 ====================

@router.get('/graph/stats')
def graph_stats():
    """图谱统计"""
    return gq.stats()


@router.get('/graph/nodes')
def graph_nodes(entity_type: str = None, limit: int = 200):
    """列出节点"""
    return gq.list_nodes(entity_type, limit)


@router.get('/graph/edges')
def graph_edges(relation_type: str = None, limit: int = 300):
    """列出边"""
    return gq.list_edges(relation_type, limit)


@router.get('/graph/entity/{node_id}')
def graph_entity(node_id: int):
    """获取节点详情"""
    result = gq.get_entity(node_id)
    if not result:
        raise HTTPException(status_code=404, detail="节点不存在")
    return result


@router.get('/graph/search')
def graph_search(keyword: str, entity_type: str = None, limit: int = 50):
    """搜索节点"""
    return gq.search(keyword, entity_type, limit)


# ==================== 邻居查询 ====================

@router.get('/graph/entity/{node_id}/neighbors')
def graph_neighbors(node_id: int, direction: str = "both", depth: int = 1):
    """获取邻居节点（支持多跳）"""
    return gq.get_neighbors(node_id, direction, depth)


# ==================== 路径查找 ====================

@router.get('/graph/path')
def graph_find_path(start_id: int, end_id: int, max_depth: int = 6):
    """查找最短路径"""
    return gq.find_path(start_id, end_id, max_depth)


@router.get('/graph/all-paths')
def graph_find_all_paths(start_id: int, end_id: int, max_depth: int = 4):
    """查找所有路径"""
    return gq.find_all_paths(start_id, end_id, max_depth)


# ==================== 子图匹配 ====================

@router.post('/graph/subgraph-match')
def graph_subgraph_match(pattern: dict):
    """子图匹配"""
    return gq.find_subgraph(pattern)


# ==================== 图谱推理 ====================

@router.get('/graph/infer/transitive')
def graph_infer_transitive(start_id: int, relation_type: str, max_depth: int = 3):
    """传递性关系推导"""
    return gq.infer_transitive_relations(start_id, relation_type, max_depth)


@router.get('/graph/infer/related')
def graph_find_related(start_id: int, target_entity_type: str, max_depth: int = 3):
    """查找关联实体"""
    return gq.find_related_entities(start_id, target_entity_type, max_depth)


# ==================== 业务查询 ====================

@router.get('/graph/equipment/{equipment_id}/lifecycle')
def equipment_lifecycle(equipment_id: int):
    """设备全生命周期信息"""
    return gq.get_equipment_lifecycle(equipment_id)


@router.get('/graph/equipment/{equipment_id}/supply-chain')
def equipment_supply_chain(equipment_id: int):
    """设备供应链信息"""
    return gq.get_supply_chain(equipment_id)


@router.get('/graph/equipment/{equipment_id}/maintenance-history')
def equipment_maintenance_history(equipment_id: int):
    """设备维修历史"""
    return gq.get_maintenance_history(equipment_id)


# ==================== 设备风险接口 ====================

@router.get('/equipment')
def equipment_list():
    """设备列表（带风险分析）"""
    from app.config import settings
    from app.db import connect, rows_to_dict
    with connect(settings.equipment_db) as conn:
        rows = conn.execute(
            'SELECT e.*, '
            'm.name AS manufacturer_name, '
            'l.name AS location_name, '
            's.name AS supplier_name '
            'FROM equipment e '
            'LEFT JOIN manufacturer m ON e.manufacturer_id = m.id '
            'LEFT JOIN location l ON e.location_id = l.id '
            'LEFT JOIN supplier s ON e.supplier_id = s.id '
            'ORDER BY e.id'
        ).fetchall()
        return rows_to_dict(rows)


@router.get('/equipment/risks')
def equipment_risks():
    """所有设备风险分析"""
    return analyze_all_equipment()


@router.get('/equipment/{equipment_id}/risk')
def equipment_risk(equipment_id: int):
    """单个设备风险分析"""
    return analyze_equipment_risk(equipment_id)


@router.get('/equipment/risk-summary')
def equipment_risk_summary():
    """风险摘要"""
    return get_risk_summary()


# ==================== 图谱管理接口 ====================

@router.post('/graph/rebuild')
def graph_rebuild():
    """重建图谱（管理员）"""
    return rebuild_graph()


@router.post('/graph/sync')
def graph_sync():
    """增量同步"""
    return incremental_sync()


# ==================== 采购领域接口 ====================

@router.get('/procurement/plans')
def procurement_plans():
    """采购计划列表"""
    from app.config import settings
    from app.db import connect, rows_to_dict
    with connect(settings.equipment_db) as conn:
        rows = conn.execute(
            '''SELECT pp.*, e.name as equipment_name
               FROM procurement_plan pp
               LEFT JOIN equipment e ON pp.equipment_id = e.id
               ORDER BY pp.id'''
        ).fetchall()
        return rows_to_dict(rows)


@router.get('/procurement/tenders')
def procurement_tenders():
    """招标项目列表"""
    from app.config import settings
    from app.db import connect, rows_to_dict
    with connect(settings.equipment_db) as conn:
        rows = conn.execute(
            '''SELECT tp.*, pp.plan_name, s.name as winner_supplier_name
               FROM tender_project tp
               LEFT JOIN procurement_plan pp ON tp.plan_id = pp.id
               LEFT JOIN supplier s ON tp.winner_supplier_id = s.id
               ORDER BY tp.id'''
        ).fetchall()
        return rows_to_dict(rows)


@router.get('/procurement/contracts')
def procurement_contracts():
    """采购合同列表"""
    from app.config import settings
    from app.db import connect, rows_to_dict
    with connect(settings.equipment_db) as conn:
        rows = conn.execute(
            '''SELECT pc.*, e.name as equipment_name, s.name as supplier_name,
                      tp.project_name as tender_project_name
               FROM purchase_contract pc
               LEFT JOIN equipment e ON pc.equipment_id = e.id
               LEFT JOIN supplier s ON pc.supplier_id = s.id
               LEFT JOIN tender_project tp ON pc.tender_project_id = tp.id
               ORDER BY pc.id'''
        ).fetchall()
        return rows_to_dict(rows)


@router.get('/procurement/acceptances')
def procurement_acceptances():
    """验收记录列表"""
    from app.config import settings
    from app.db import connect, rows_to_dict
    with connect(settings.equipment_db) as conn:
        rows = conn.execute(
            '''SELECT ar.*, pc.contract_no, e.name as equipment_name
               FROM acceptance_record ar
               LEFT JOIN purchase_contract pc ON ar.contract_id = pc.id
               LEFT JOIN equipment e ON ar.equipment_id = e.id
               ORDER BY ar.id'''
        ).fetchall()
        return rows_to_dict(rows)


# ==================== 试验鉴定接口 ====================

@router.get('/testing/projects')
def testing_projects():
    """试验项目列表"""
    from app.config import settings
    from app.db import connect, rows_to_dict
    with connect(settings.equipment_db) as conn:
        rows = conn.execute(
            '''SELECT tp.*, e.name as equipment_name
               FROM test_project tp
               LEFT JOIN equipment e ON tp.equipment_id = e.id
               ORDER BY tp.id'''
        ).fetchall()
        return rows_to_dict(rows)


@router.get('/testing/projects/{project_id}')
def testing_project_detail(project_id: int):
    """试验项目详情"""
    from app.config import settings
    from app.db import connect, rows_to_dict
    with connect(settings.equipment_db) as conn:
        project = conn.execute(
            '''SELECT tp.*, e.name as equipment_name
               FROM test_project tp
               LEFT JOIN equipment e ON tp.equipment_id = e.id
               WHERE tp.id=?''',
            (project_id,)
        ).fetchone()
        if not project:
            raise HTTPException(status_code=404, detail="试验项目不存在")

        plans = conn.execute("SELECT * FROM test_plan WHERE project_id=?", (project_id,)).fetchall()
        test_data = conn.execute("SELECT * FROM test_data WHERE project_id=?", (project_id,)).fetchall()
        conclusions = conn.execute("SELECT * FROM appraisal_conclusion WHERE project_id=?", (project_id,)).fetchall()

        return {
            "project": dict(project),
            "plans": rows_to_dict(plans),
            "test_data": rows_to_dict(test_data),
            "conclusions": rows_to_dict(conclusions)
        }


@router.get('/testing/data')
def testing_data(project_id: int = None):
    """试验数据列表"""
    from app.config import settings
    from app.db import connect, rows_to_dict
    with connect(settings.equipment_db) as conn:
        if project_id:
            rows = conn.execute(
                '''SELECT td.*, tp.project_name
                   FROM test_data td
                   JOIN test_project tp ON td.project_id = tp.id
                   WHERE td.project_id=?
                   ORDER BY td.id''',
                (project_id,)
            ).fetchall()
        else:
            rows = conn.execute(
                '''SELECT td.*, tp.project_name
                   FROM test_data td
                   JOIN test_project tp ON td.project_id = tp.id
                   ORDER BY td.id'''
            ).fetchall()
        return rows_to_dict(rows)


@router.get('/testing/conclusions')
def testing_conclusions():
    """鉴定结论列表"""
    from app.config import settings
    from app.db import connect, rows_to_dict
    with connect(settings.equipment_db) as conn:
        rows = conn.execute(
            '''SELECT ac.*, tp.project_name, e.name as equipment_name
               FROM appraisal_conclusion ac
               JOIN test_project tp ON ac.project_id = tp.id
               LEFT JOIN equipment e ON tp.equipment_id = e.id
               ORDER BY ac.id'''
        ).fetchall()
        return rows_to_dict(rows)


# ==================== 维修保障接口 ====================

@router.get('/maintenance/plans')
def maintenance_plans():
    """维修计划列表"""
    from app.config import settings
    from app.db import connect, rows_to_dict
    with connect(settings.equipment_db) as conn:
        rows = conn.execute(
            '''SELECT mp.*, e.name as equipment_name
               FROM maintenance_plan mp
               LEFT JOIN equipment e ON mp.equipment_id = e.id
               ORDER BY mp.id'''
        ).fetchall()
        return rows_to_dict(rows)


@router.get('/maintenance/orders')
def maintenance_orders():
    """维修工单列表"""
    from app.config import settings
    from app.db import connect, rows_to_dict
    with connect(settings.equipment_db) as conn:
        rows = conn.execute(
            '''SELECT mo.*, e.name as equipment_name, fm.mode_name as failure_mode_name
               FROM maintenance_order mo
               LEFT JOIN equipment e ON mo.equipment_id = e.id
               LEFT JOIN failure_mode fm ON mo.failure_mode_id = fm.id
               ORDER BY mo.id'''
        ).fetchall()
        return rows_to_dict(rows)


@router.get('/maintenance/orders/{order_id}')
def maintenance_order_detail(order_id: int):
    """维修工单详情"""
    from app.config import settings
    from app.db import connect, rows_to_dict
    with connect(settings.equipment_db) as conn:
        order = conn.execute(
            '''SELECT mo.*, e.name as equipment_name, fm.mode_name as failure_mode_name
               FROM maintenance_order mo
               LEFT JOIN equipment e ON mo.equipment_id = e.id
               LEFT JOIN failure_mode fm ON mo.failure_mode_id = fm.id
               WHERE mo.id=?''',
            (order_id,)
        ).fetchone()
        if not order:
            raise HTTPException(status_code=404, detail="维修工单不存在")

        spare_usages = conn.execute(
            '''SELECT su.*, sp.part_name, sp.part_no
               FROM spare_usage su
               JOIN spare_part sp ON su.spare_part_id = sp.id
               WHERE su.order_id=?''',
            (order_id,)
        ).fetchall()

        return {
            "order": dict(order),
            "spare_usages": rows_to_dict(spare_usages)
        }


@router.get('/maintenance/failure-modes')
def failure_modes():
    """故障模式列表"""
    from app.config import settings
    from app.db import connect, rows_to_dict
    with connect(settings.equipment_db) as conn:
        rows = conn.execute("SELECT * FROM failure_mode ORDER BY id").fetchall()
        return rows_to_dict(rows)


@router.get('/maintenance/spare-parts')
def spare_parts():
    """备件列表"""
    from app.config import settings
    from app.db import connect, rows_to_dict
    with connect(settings.equipment_db) as conn:
        rows = conn.execute(
            '''SELECT sp.*, s.name as supplier_name
               FROM spare_part sp
               LEFT JOIN supplier s ON sp.supplier_id = s.id
               ORDER BY sp.id'''
        ).fetchall()
        return rows_to_dict(rows)


@router.get('/maintenance/resources')
def support_resources():
    """保障资源列表"""
    from app.config import settings
    from app.db import connect, rows_to_dict
    with connect(settings.equipment_db) as conn:
        rows = conn.execute(
            '''SELECT sr.*, l.name as location_name
               FROM support_resource sr
               LEFT JOIN location l ON sr.location_id = l.id
               ORDER BY sr.id'''
        ).fetchall()
        return rows_to_dict(rows)

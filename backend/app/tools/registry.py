"""
工具注册表 - 注册所有可用的Agent工具
"""
from app.services.datasource_service import DataSourceService
from app.tools.metadata_tools import list_tables, describe_table
from app.tools.sql_tools import query_sql
from app.tools.graph_tools import (
    search_graph, get_entity_neighbors, find_path,
    get_equipment_lifecycle, get_supply_chain, get_maintenance_history
)
from app.tools.equipment_tools import analyze_equipment_risk


def list_data_sources() -> list[dict]:
    return DataSourceService().list_datasources()


TOOLS = {
    "list_data_sources": list_data_sources,
    "list_tables": list_tables,
    "describe_table": describe_table,
    "query_sql": query_sql,
    "search_graph": search_graph,
    "get_entity_neighbors": get_entity_neighbors,
    "find_path": find_path,
    "analyze_equipment_risk": analyze_equipment_risk,
    "get_equipment_lifecycle": get_equipment_lifecycle,
    "get_supply_chain": get_supply_chain,
    "get_maintenance_history": get_maintenance_history,
}

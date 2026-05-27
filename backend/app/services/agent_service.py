"""
Agent服务 - 基于LLM的智能问答
"""
import json
from app.config import settings
from app.tools.registry import TOOLS
from app.schemas.chat import ChatResponse, ToolCallTrace
from app.services.llm_client import LLMClient
from app.tools.equipment_tools import analyze_equipment_risk

SYSTEM_PROMPT = """你是一个设备全生命周期管理智能助手，通过调用工具查询数据并用中文回答用户问题。

## 业务领域
系统覆盖三大业务领域：
1. **设备采购** - 采购计划、招标项目、采购合同、验收记录
2. **试验鉴定** - 试验项目、试验方案、试验数据、鉴定结论
3. **设备维修保障** - 维修计划、维修工单、故障模式、备件管理、保障资源

## 数据库结构
业务库包含以下表：

### 基础表
- equipment(id, name, model, category, manufacturer_id, status, location_id, supplier_id, importance_level, purchase_date, commission_date, expected_life_years, serial_no) — 设备信息
- manufacturer(id, name, qualification_level, contact, address, established_year) — 生产厂家
- supplier(id, name, credit_level, risk_level, contact, address) — 供应商
- location(id, name, type, parent_id, description) — 部署位置

### 采购领域
- procurement_plan(id, plan_name, plan_year, equipment_id, quantity, budget_amount, status, approved_date, approver) — 采购计划
- tender_project(id, project_name, plan_id, tender_method, publish_date, bid_deadline, status, winner_supplier_id) — 招标项目
- purchase_contract(id, contract_no, equipment_id, supplier_id, tender_project_id, amount, sign_date, delivery_date, status, payment_terms) — 采购合同
- acceptance_record(id, acceptance_no, contract_id, equipment_id, acceptance_date, result, inspector, remarks) — 验收记录

### 试验鉴定领域
- test_project(id, project_name, equipment_id, test_type, start_date, end_date, status, conclusion, tester) — 试验项目
- test_plan(id, plan_name, project_id, test_conditions, test_items, acceptance_criteria, created_by) — 试验方案
- test_data(id, project_id, test_item, measured_value, expected_value, unit, pass_flag, test_time, operator) — 试验数据
- appraisal_conclusion(id, conclusion_no, project_id, appraisal_date, result, experts, remarks) — 鉴定结论

### 维修保障领域
- failure_mode(id, mode_name, category, severity_level, detection_method, description) — 故障模式
- maintenance_plan(id, plan_name, equipment_id, plan_type, planned_date, status, priority) — 维修计划
- maintenance_order(id, order_no, equipment_id, plan_id, failure_mode_id, fault_desc, repair_action, start_time, end_time, operator, status, severity, cost) — 维修工单
- spare_part(id, part_name, part_no, category, stock_qty, min_stock, unit_price, supplier_id) — 备件
- spare_usage(id, order_id, spare_part_id, quantity, usage_time) — 备件使用记录
- support_resource(id, resource_name, resource_type, quantity, status, location_id) — 保障资源

## 工具使用指南

### 风险分析
- 查设备风险/异常 → **优先用 analyze_equipment_risk**，逐个或批量调用

### SQL查询
- 查设备列表/状态 → 用 query_sql，如 SELECT * FROM equipment
- 查表结构/元数据 → 用 list_tables + describe_table
- 复杂统计查询 → 用 query_sql 支持JOIN和聚合

### 图谱查询
- 搜索实体 → search_graph(输入具体名称如"空压机A")
- 获取实体邻居 → get_entity_neighbors(节点ID, direction, depth)
- 查找路径 → find_path(起点ID, 终点ID)
- 设备全生命周期 → get_equipment_lifecycle(设备ID)
- 设备供应链 → get_supply_chain(设备ID)
- 设备维修历史 → get_maintenance_history(设备ID)

### 业务查询
- 采购计划/合同 → 用 query_sql 查询 procurement_plan, purchase_contract 等表
- 试验数据/结论 → 用 query_sql 查询 test_project, test_data 等表
- 维修工单/备件 → 用 query_sql 查询 maintenance_order, spare_part 等表

## 重要规则
1. 需要分析设备风险时，使用 analyze_equipment_risk
2. 查询业务数据时，优先使用 query_sql 进行灵活查询
3. 需要了解实体关联关系时，使用图谱相关工具
4. 不要重复调用已获取过结果的工具
5. 收集到足够数据后立即给出最终回答
"""

TOOL_DEFINITIONS = [
    {
        "type": "function",
        "function": {
            "name": "list_data_sources",
            "description": "列出所有可用的数据源",
            "parameters": {"type": "object", "properties": {}},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "list_tables",
            "description": "列出当前数据源中的所有表名",
            "parameters": {"type": "object", "properties": {}},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "describe_table",
            "description": "获取指定表的列信息",
            "parameters": {
                "type": "object",
                "properties": {"table_name": {"type": "string", "description": "表名"}},
                "required": ["table_name"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "query_sql",
            "description": "执行只读SQL查询（仅允许SELECT），最多返回50行。支持JOIN、聚合、子查询等复杂查询。",
            "parameters": {
                "type": "object",
                "properties": {"sql": {"type": "string", "description": "SQL查询语句"}},
                "required": ["sql"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "search_graph",
            "description": "在知识图谱中搜索包含关键词的实体节点",
            "parameters": {
                "type": "object",
                "properties": {
                    "keyword": {"type": "string", "description": "搜索关键词"},
                    "entity_type": {"type": "string", "description": "实体类型（可选）"}
                },
                "required": ["keyword"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_entity_neighbors",
            "description": "获取知识图谱中某实体的邻居节点及关系，支持多跳查询",
            "parameters": {
                "type": "object",
                "properties": {
                    "node_id": {"type": "integer", "description": "实体节点ID"},
                    "direction": {"type": "string", "description": "方向: out/in/both，默认both"},
                    "depth": {"type": "integer", "description": "查询深度，默认1，最大5"}
                },
                "required": ["node_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "analyze_equipment_risk",
            "description": "分析指定设备的风险等级和风险原因，基于规则引擎",
            "parameters": {
                "type": "object",
                "properties": {"equipment_id": {"type": "integer", "description": "设备ID"}},
                "required": ["equipment_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "find_path",
            "description": "查找两个图谱节点之间的最短路径",
            "parameters": {
                "type": "object",
                "properties": {
                    "start_id": {"type": "integer", "description": "起点节点ID"},
                    "end_id": {"type": "integer", "description": "终点节点ID"},
                    "max_depth": {"type": "integer", "description": "最大搜索深度，默认6"}
                },
                "required": ["start_id", "end_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_equipment_lifecycle",
            "description": "获取设备全生命周期信息（采购、试验、维修、供应链）",
            "parameters": {
                "type": "object",
                "properties": {"equipment_id": {"type": "integer", "description": "设备ID"}},
                "required": ["equipment_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_supply_chain",
            "description": "获取设备供应链信息（厂家、供应商、位置、合同）",
            "parameters": {
                "type": "object",
                "properties": {"equipment_id": {"type": "integer", "description": "设备ID"}},
                "required": ["equipment_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_maintenance_history",
            "description": "获取设备维修历史（计划、工单、故障模式、备件）",
            "parameters": {
                "type": "object",
                "properties": {"equipment_id": {"type": "integer", "description": "设备ID"}},
                "required": ["equipment_id"],
            },
        },
    },
]


class AgentService:
    def __init__(self) -> None:
        self.llm = LLMClient()

    def _mock(self, msg: str) -> ChatResponse:
        traces = []
        text = ""
        if "数据源" in msg:
            r = TOOLS["list_data_sources"]()
            traces.append(ToolCallTrace(tool_name="list_data_sources", arguments={}, result_preview=str(r[:2])))
            text = f"数据来源: TOOL。当前数据源: {r}"
        elif "表" in msg:
            r = TOOLS["list_tables"]()
            traces.append(ToolCallTrace(tool_name="list_tables", arguments={}, result_preview=str(r)))
            text = f"数据来源: SQL元数据。表有: {', '.join(r)}"
        elif "异常" in msg or "风险" in msg:
            res = [analyze_equipment_risk(i) for i in range(1, 11)]
            high = [x for x in res if x['risk_level'] == '高']
            traces.append(ToolCallTrace(tool_name="analyze_equipment_risk", arguments={"batch": "1..10"}, result_preview=str(high[:2])))
            text = f"数据来源: TOOL+SQL。高风险设备: {high}"
        elif "采购" in msg:
            text = "数据来源: SQL。您可以通过SQL查询采购计划、招标项目、采购合同、验收记录等表。"
        elif "试验" in msg or "鉴定" in msg:
            text = "数据来源: SQL。您可以通过SQL查询试验项目、试验方案、试验数据、鉴定结论等表。"
        elif "维修" in msg or "保障" in msg:
            text = "数据来源: SQL。您可以通过SQL查询维修计划、维修工单、故障模式、备件等表。"
        else:
            text = "数据来源: LLM(MOCK)。请询问设备风险、采购、试验鉴定、维修保障等相关问题。"
        return ChatResponse(answer=text, tool_calls=traces, data_source="TOOL")

    def _call_tool(self, name: str, arguments: dict) -> str:
        func = TOOLS.get(name)
        if not func:
            return f"未知工具: {name}"
        try:
            result = func(**arguments)
            return json.dumps(result, ensure_ascii=False) if not isinstance(result, str) else result
        except Exception as e:
            return f"工具调用出错: {e}"

    MAX_ITERATIONS = 10

    def _real(self, message: str) -> ChatResponse:
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": message},
        ]
        traces: list[ToolCallTrace] = []

        for _ in range(self.MAX_ITERATIONS):
            resp = self.llm.chat_with_tools(messages, TOOL_DEFINITIONS)
            tool_calls = resp.get("tool_calls")

            if not tool_calls:
                answer = resp.get("content") or ""
                return ChatResponse(
                    answer=answer,
                    tool_calls=traces,
                    data_source="LLM+TOOL" if traces else "LLM",
                )

            messages.append(resp)

            for tc in tool_calls:
                fn = tc["function"]
                name = fn["name"]
                try:
                    arguments = json.loads(fn["arguments"])
                except json.JSONDecodeError:
                    arguments = {}
                result_str = self._call_tool(name, arguments)
                traces.append(ToolCallTrace(
                    tool_name=name,
                    arguments=arguments,
                    result_preview=result_str[:500],
                ))
                messages.append({
                    "role": "tool",
                    "tool_call_id": tc["id"],
                    "content": result_str,
                })

        return ChatResponse(answer="工具调用轮次已达上限，请简化问题。", tool_calls=traces, data_source="LLM+TOOL")

    def chat(self, message: str) -> ChatResponse:
        if settings.mock_llm:
            return self._mock(message)
        if not self.llm.enabled:
            return self._mock(message)
        return self._real(message)

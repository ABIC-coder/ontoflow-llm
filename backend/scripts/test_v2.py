"""
功能测试脚本 - 测试新的本体驱动图谱构建和业务API
"""
import sys
import json
from pathlib import Path

# 添加项目路径
ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.config import settings
from app.bootstrap import init_demo_databases, build_graph, incremental_sync
from app.services.graph_query import AdvancedGraphQuery
from app.services.rule_engine import RuleEngine, EquipmentRiskAnalyzer


def test_database_init():
    """测试数据库初始化"""
    print("=" * 60)
    print("1. 测试数据库初始化")
    print("=" * 60)

    # 删除旧数据库
    if settings.equipment_db.exists():
        settings.equipment_db.unlink()
    if settings.platform_db.exists():
        settings.platform_db.unlink()

    init_demo_databases()
    print("[OK] 数据库初始化成功")

    # 验证表数量
    import sqlite3
    with sqlite3.connect(settings.equipment_db) as conn:
        tables = conn.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()
        print(f"  业务库表数量: {len(tables)}")
        for t in tables:
            count = conn.execute(f"SELECT COUNT(*) FROM {t[0]}").fetchone()[0]
            print(f"    - {t[0]}: {count} 条记录")


def test_graph_build():
    """测试图谱构建"""
    print("\n" + "=" * 60)
    print("2. 测试本体驱动图谱构建")
    print("=" * 60)

    result = build_graph()
    print(f"[OK] 图谱构建成功")
    print(f"  节点数量: {result['node_count']}")
    print(f"  边数量: {result['edge_count']}")
    print(f"  耗时: {result['elapsed_seconds']:.2f} 秒")


def test_graph_query():
    """测试图谱查询"""
    print("\n" + "=" * 60)
    print("3. 测试高级图谱查询")
    print("=" * 60)

    gq = AdvancedGraphQuery()

    # 测试统计
    stats = gq.stats()
    print(f"[OK] 图谱统计:")
    print(f"  节点: {stats['node_count']}, 边: {stats['edge_count']}")
    print(f"  实体类型: {stats['entity_types']}")
    print(f"  关系类型: {stats['relation_types']}")

    # 测试搜索
    results = gq.search("空压机")
    print(f"\n[OK] 搜索'空压机': {len(results)} 个结果")
    for r in results[:3]:
        print(f"    - {r['label']} ({r['entity_type']})")

    # 测试邻居查询
    neighbors = gq.get_neighbors(1, "both", depth=2)
    print(f"\n[OK] 节点1的邻居(深度2): {len(neighbors['nodes'])} 个节点, {len(neighbors['edges'])} 条边")

    # 测试路径查找
    path = gq.find_path(1, 10)
    print(f"\n[OK] 路径查找 (1->10): {'找到' if path['found'] else '未找到'}")
    if path['found']:
        print(f"  路径长度: {path['length']}")

    # 测试设备生命周期
    lifecycle = gq.get_equipment_lifecycle(2)
    print(f"\n[OK] 设备2全生命周期:")
    print(f"  采购相关: {len(lifecycle.get('procurement', []))} 个")
    print(f"  试验相关: {len(lifecycle.get('testing', []))} 个")
    print(f"  维修相关: {len(lifecycle.get('maintenance', []))} 个")
    print(f"  供应链: {len(lifecycle.get('supply_chain', []))} 个")


def test_rule_engine():
    """测试规则引擎"""
    print("\n" + "=" * 60)
    print("4. 测试规则引擎")
    print("=" * 60)

    engine = RuleEngine()

    # 评估所有规则
    results = engine.evaluate_all()
    print(f"[OK] 规则评估完成:")
    print(f"  设备风险: {len(results['equipment_risks'])} 个")
    print(f"  告警: {len(results['alerts'])} 个")

    if results['equipment_risks']:
        print("\n  高风险设备:")
        for risk in results['equipment_risks']:
            if risk.get('risk_level') == '高':
                print(f"    - 设备ID {risk['entity_id']}: {risk.get('reasons', [])}")


def test_risk_analyzer():
    """测试风险分析器"""
    print("\n" + "=" * 60)
    print("5. 测试设备风险分析")
    print("=" * 60)

    analyzer = EquipmentRiskAnalyzer()

    # 分析单个设备
    risk = analyzer.analyze_equipment(2)
    print(f"[OK] 设备2风险分析:")
    print(f"  设备名称: {risk['equipment_name']}")
    print(f"  风险等级: {risk['risk_level']}")
    print(f"  风险分数: {risk['risk_score']}")
    print(f"  风险原因: {risk['reasons']}")

    # 获取风险摘要
    summary = analyzer.get_risk_summary()
    print(f"\n[OK] 风险摘要:")
    print(f"  设备总数: {summary['total_equipment']}")
    print(f"  高风险: {summary['high_risk']}")
    print(f"  中风险: {summary['medium_risk']}")
    print(f"  低风险: {summary['low_risk']}")


def test_incremental_sync():
    """测试增量同步"""
    print("\n" + "=" * 60)
    print("6. 测试增量同步")
    print("=" * 60)

    result = incremental_sync()
    print(f"[OK] 增量同步完成:")
    print(f"  新增节点: {result['new_nodes']}")
    print(f"  更新节点: {result['updated_nodes']}")
    print(f"  新增边: {result['new_edges']}")
    print(f"  耗时: {result['elapsed_seconds']:.2f} 秒")


def main():
    print("开始测试...\n")

    test_database_init()
    test_graph_build()
    test_graph_query()
    test_rule_engine()
    test_risk_analyzer()
    test_incremental_sync()

    print("\n" + "=" * 60)
    print("所有测试完成!")
    print("=" * 60)


if __name__ == '__main__':
    main()

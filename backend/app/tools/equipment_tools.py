"""
设备工具 - 基于规则引擎的风险分析
"""
from app.services.rule_engine import EquipmentRiskAnalyzer

_analyzer = EquipmentRiskAnalyzer()


def analyze_equipment_risk(equipment_id: int) -> dict:
    """分析单个设备的风险"""
    return _analyzer.analyze_equipment(equipment_id)


def analyze_all_equipment() -> list[dict]:
    """分析所有设备"""
    return _analyzer.analyze_all()


def get_risk_summary() -> dict:
    """获取风险摘要"""
    return _analyzer.get_risk_summary()

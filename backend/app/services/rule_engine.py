"""
设备风险分析器 - 优化版本
"""
import logging
from datetime import datetime
from app.config import settings
from app.db import connect, rows_to_dict
from app.cache import cached

logger = logging.getLogger(__name__)


class EquipmentRiskAnalyzer:
    """设备风险分析器 - 优化版本"""

    def __init__(self):
        pass

    def analyze_equipment(self, equipment_id: int) -> dict:
        """分析单个设备的风险"""
        with connect(settings.equipment_db) as conn:
            eq = conn.execute("SELECT * FROM equipment WHERE id=?", (equipment_id,)).fetchone()
            if not eq:
                raise ValueError(f"设备 {equipment_id} 不存在")

            eq_dict = dict(eq)

            # 获取关联信息
            supplier = conn.execute("SELECT * FROM supplier WHERE id=?", (eq_dict['supplier_id'],)).fetchone()
            manufacturer = conn.execute("SELECT * FROM manufacturer WHERE id=?", (eq_dict['manufacturer_id'],)).fetchone()
            location = conn.execute("SELECT * FROM location WHERE id=?", (eq_dict['location_id'],)).fetchone()

            # 获取维修记录统计
            maintenance_stats = conn.execute(
                """SELECT 
                    COUNT(*) as total_count,
                    MAX(CASE WHEN severity='高' THEN 1 ELSE 0 END) as has_high_severity
                   FROM maintenance_order 
                   WHERE equipment_id=?""",
                (equipment_id,)
            ).fetchone()

            # 获取试验记录
            failed_test_count = conn.execute(
                """SELECT COUNT(*) FROM test_project tp
                   JOIN appraisal_conclusion ac ON ac.project_id = tp.id
                   WHERE tp.equipment_id=? AND ac.result='不通过'""",
                (equipment_id,)
            ).fetchone()[0]

        maintenance_count = maintenance_stats[0] if maintenance_stats else 0
        has_high_severity = maintenance_stats[1] if maintenance_stats else 0

        # 计算风险分数
        score = 0
        reasons = []

        # 基础状态风险
        if eq_dict['status'] == '异常':
            score += 30
            reasons.append('设备状态异常 +30')
        elif eq_dict['status'] == '故障':
            score += 40
            reasons.append('设备故障 +40')
        elif eq_dict['status'] == '维修中':
            score += 20
            reasons.append('设备维修中 +20')

        # 重要等级
        if eq_dict['importance_level'] == '关键':
            score += 20
            reasons.append('关键设备 +20')

        # 维修频次
        if maintenance_count >= 3:
            score += 20
            reasons.append(f'维修次数{maintenance_count}次 >= 3 +20')
        elif maintenance_count >= 2:
            score += 10
            reasons.append(f'维修次数{maintenance_count}次 >= 2 +10')

        # 高严重度维修
        if has_high_severity:
            score += 15
            reasons.append('存在高严重度维修 +15')

        # 供应商风险
        if supplier:
            supplier_dict = dict(supplier)
            if supplier_dict['risk_level'] == '高':
                score += 20
                reasons.append('供应商风险高 +20')
            elif supplier_dict['risk_level'] == '中':
                score += 10
                reasons.append('供应商风险中 +10')

        # 试验未通过
        if failed_test_count > 0:
            score += 25
            reasons.append(f'存在{failed_test_count}个未通过的试验项目 +25')

        # 计算最终风险等级
        risk_level = '高' if score >= 70 else ('中' if score >= 40 else '低')

        return {
            "equipment_id": equipment_id,
            "equipment_name": eq_dict['name'],
            "equipment_status": eq_dict['status'],
            "importance_level": eq_dict['importance_level'],
            "risk_score": min(score, 100),
            "risk_level": risk_level,
            "reasons": reasons,
            "related_supplier": dict(supplier)['name'] if supplier else None,
            "related_manufacturer": dict(manufacturer)['name'] if manufacturer else None,
            "related_location": dict(location)['name'] if location else None,
            "maintenance_count": maintenance_count,
            "failed_test_count": failed_test_count,
            "analyzed_at": datetime.now().isoformat()
        }

    @cached(ttl=30, key_prefix="risk")
    def analyze_all(self) -> list[dict]:
        """分析所有设备（带缓存）"""
        with connect(settings.equipment_db) as conn:
            equipments = conn.execute("SELECT id FROM equipment ORDER BY id").fetchall()

        results = []
        for eq in equipments:
            try:
                result = self.analyze_equipment(eq[0])
                results.append(result)
            except Exception as e:
                logger.error(f"分析设备 {eq[0]} 失败: {e}")

        return results

    @cached(ttl=30, key_prefix="risk")
    def get_risk_summary(self) -> dict:
        """获取风险摘要（带缓存）"""
        all_risks = self.analyze_all()

        summary = {
            "total_equipment": len(all_risks),
            "high_risk": len([r for r in all_risks if r['risk_level'] == '高']),
            "medium_risk": len([r for r in all_risks if r['risk_level'] == '中']),
            "low_risk": len([r for r in all_risks if r['risk_level'] == '低']),
            "high_risk_equipment": [
                {
                    "id": r['equipment_id'],
                    "name": r['equipment_name'],
                    "score": r['risk_score'],
                    "reasons": r['reasons']
                }
                for r in all_risks if r['risk_level'] == '高'
            ],
            "alerts": [],
            "evaluated_at": datetime.now().isoformat()
        }

        return summary

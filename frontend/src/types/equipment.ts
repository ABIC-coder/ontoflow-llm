export interface Equipment {
  id: number;
  name: string;
  model?: string;
  category?: string;
  manufacturer_id?: number;
  manufacturer_name?: string;
  status?: string;
  location_id?: number;
  location_name?: string;
  supplier_id?: number;
  supplier_name?: string;
  importance_level?: string;
  purchase_date?: string;
  commission_date?: string;
  expected_life_years?: number;
  serial_no?: string;
}

export interface EquipmentRisk {
  equipment_id: number;
  equipment_name: string;
  equipment_status?: string;
  importance_level?: string;
  risk_score: number;
  risk_level: string;
  reasons: string[];
  related_supplier?: string | null;
  related_manufacturer?: string | null;
  related_location?: string | null;
  maintenance_count: number;
  failed_test_count?: number;
  rule_based_risks?: RuleRisk[];
  analyzed_at?: string;
}

export interface RuleRisk {
  rule_id: string;
  rule_name: string;
  risk_level?: string;
  reason?: string;
}

export interface RiskSummary {
  total_equipment: number;
  high_risk: number;
  medium_risk: number;
  low_risk: number;
  high_risk_equipment: {
    id: number;
    name: string;
    score: number;
    reasons: string[];
  }[];
  alerts: {
    rule_id: string;
    rule_name: string;
    reason: string;
  }[];
  evaluated_at: string;
}

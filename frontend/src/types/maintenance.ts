export interface FailureMode {
  id: number;
  mode_name: string;
  category: string;
  severity_level: string;
  detection_method: string;
  description: string;
}

export interface MaintenancePlan {
  id: number;
  plan_name: string;
  equipment_id: number;
  equipment_name?: string;
  plan_type: string;
  planned_date: string;
  status: string;
  priority: string;
}

export interface MaintenanceOrder {
  id: number;
  order_no: string;
  equipment_id: number;
  equipment_name?: string;
  plan_id?: number;
  failure_mode_id?: number;
  failure_mode_name?: string;
  fault_desc: string;
  repair_action: string;
  start_time: string;
  end_time?: string;
  operator: string;
  status: string;
  severity: string;
  cost: number;
}

export interface MaintenanceOrderDetail {
  order: MaintenanceOrder;
  spare_usages: SpareUsage[];
}

export interface SparePart {
  id: number;
  part_name: string;
  part_no: string;
  category: string;
  stock_qty: number;
  min_stock: number;
  unit_price: number;
  supplier_id?: number;
  supplier_name?: string;
}

export interface SpareUsage {
  id: number;
  order_id: number;
  spare_part_id: number;
  part_name?: string;
  part_no?: string;
  quantity: number;
  usage_time: string;
}

export interface SupportResource {
  id: number;
  resource_name: string;
  resource_type: string;
  quantity: number;
  status: string;
  location_id?: number;
  location_name?: string;
}

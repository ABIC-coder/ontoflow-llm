export interface ProcurementPlan {
  id: number;
  plan_name: string;
  plan_year: number;
  equipment_id: number;
  equipment_name?: string;
  quantity: number;
  budget_amount: number;
  status: string;
  approved_date?: string;
  approver?: string;
}

export interface TenderProject {
  id: number;
  project_name: string;
  plan_id: number;
  plan_name?: string;
  tender_method: string;
  publish_date: string;
  bid_deadline: string;
  status: string;
  winner_supplier_id?: number;
  winner_supplier_name?: string;
}

export interface PurchaseContract {
  id: number;
  contract_no: string;
  equipment_id: number;
  equipment_name?: string;
  supplier_id: number;
  supplier_name?: string;
  tender_project_id?: number;
  tender_project_name?: string;
  amount: number;
  sign_date: string;
  delivery_date: string;
  status: string;
  payment_terms: string;
}

export interface AcceptanceRecord {
  id: number;
  acceptance_no: string;
  contract_id: number;
  contract_no?: string;
  equipment_id: number;
  equipment_name?: string;
  acceptance_date: string;
  result: string;
  inspector: string;
  remarks: string;
}

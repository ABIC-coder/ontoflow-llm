export interface TestProject {
  id: number;
  project_name: string;
  equipment_id: number;
  equipment_name?: string;
  test_type: string;
  start_date: string;
  end_date: string;
  status: string;
  conclusion?: string;
  tester: string;
}

export interface TestPlan {
  id: number;
  plan_name: string;
  project_id: number;
  test_conditions: string;
  test_items: string;
  acceptance_criteria: string;
  created_by: string;
}

export interface TestData {
  id: number;
  project_id: number;
  project_name?: string;
  test_item: string;
  measured_value: number;
  expected_value: number;
  unit: string;
  pass_flag: number;
  test_time: string;
  operator: string;
}

export interface AppraisalConclusion {
  id: number;
  conclusion_no: string;
  project_id: number;
  project_name?: string;
  equipment_name?: string;
  appraisal_date: string;
  result: string;
  experts: string;
  remarks: string;
}

export interface TestProjectDetail {
  project: TestProject;
  plans: TestPlan[];
  test_data: TestData[];
  conclusions: AppraisalConclusion[];
}

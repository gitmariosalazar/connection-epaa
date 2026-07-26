export interface GeoJsonPoint {
  type: 'Point';
  coordinates: [number, number];
}

export interface SqlViewApproverDetail {
  approver_id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  role_id: number;
}

export interface SqlViewClientDetail {
  type: 'NATURAL' | 'EMPRESA';
  identification: string;
  full_name: string;
}

export interface SqlViewAnalystDetail {
  analyst_id: string;
  first_name: string;
  last_name: string;
}

export interface SqlViewDocument {
  document_id: string;
  file_url: string;
  original_name: string | null;
  validation_status: string;
}

export interface SqlViewRequestDetail {
  request_id: string;
  request_number: string;
  connection_type: string;
  property_use: string;
  address: string;
  status: string;
  cadastral_code: string | null;
  client: SqlViewClientDetail | null;
  analyst: SqlViewAnalystDetail | null;
  documents: SqlViewDocument[];
}

export interface SqlViewWorker {
  assignment_id: string;
  worker_id: string;
  is_responsible: boolean;
  assignment_date: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  role_id: number;
}

export interface SqlViewMaterial {
  material_id: number;
  code: string;
  name: string;
  quantity: number;
  unit_cost: number;
  subtotal: number;
}

export interface SqlViewAttachment {
  attachment_id: string;
  type: string;
  file_url: string;
  created_at: string;
}

export interface SqlViewObservation {
  observation_id: string;
  text: string;
  created_at: string;
}

export interface SqlViewWorkOrderDetail {
  work_order_id: string;
  order_code: string;
  status: string;
  origin: string;
  priority_id: number;
  assignment_date: string | null;
  completed_date: string | null;
  workers: SqlViewWorker[];
  materials: SqlViewMaterial[];
  attachments: SqlViewAttachment[];
  observations: SqlViewObservation[];
}

export interface SqlViewInspectionReport {
  report_id: string;
  request_number: string;
  order_code: string;
  result: string;
  network_distance_meters: number | null;
  connection_diameter: string | null;
  terrain_conditions: string | null;
  observations: string | null;
  location: GeoJsonPoint | null;
  materials_cost: number | null;
  labor_cost: number | null;
  total_cost: number | null;
  is_approved: boolean | null;
  rejection_reason: string | null;
  approval_date: string | null;
  created_at: string;

  approver_detail: SqlViewApproverDetail | null;
  request_detail: SqlViewRequestDetail;
  work_order_detail: SqlViewWorkOrderDetail;
}

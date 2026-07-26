export interface GeoPointResponse {
  latitude: number;
  longitude: number;
}

export interface ApproverResponse {
  id: string;
  fullName: string;
  email: string | null;
  roleId: number;
}

export interface ClientResponse {
  type: 'NATURAL' | 'EMPRESA';
  identification: string;
  fullName: string;
}

export interface AnalystResponse {
  id: string;
  fullName: string;
}

export interface DocumentResponse {
  id: string;
  fileUrl: string;
  originalName: string | null;
  validationStatus: string;
}

export interface RequestDetailResponse {
  id: string;
  requestNumber: string;
  connectionType: string;
  propertyUse: string;
  address: string;
  status: string;
  cadastralCode: string | null;
  client: ClientResponse | null;
  analyst: AnalystResponse | null;
  documents: DocumentResponse[];
}

export interface WorkerResponse {
  assignmentId: string;
  workerId: string;
  isResponsible: boolean;
  assignmentDate: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  roleId: number;
}

export interface MaterialResponse {
  id: number;
  code: string;
  name: string;
  quantity: number;
  unitCost: number;
  subtotal: number;
}

export interface EvidenceAttachmentResponse {
  id: string;
  type: string;
  fileUrl: string;
  createdAt: string;
}

export interface WorkOrderObservationResponse {
  id: string;
  text: string;
  createdAt: string;
}

export interface WorkOrderDetailResponse {
  id: string;
  orderCode: string;
  status: string;
  origin: string;
  priorityId: number;
  assignmentDate: string | null;
  completedDate: string | null;
  workers: WorkerResponse[];
  materials: MaterialResponse[];
  evidenceAttachments: EvidenceAttachmentResponse[];
  observations: WorkOrderObservationResponse[];
}

export interface InstallationReportResponse {
  id: string;
  result: string;
  installationDate: string;
  meterNumber: string | null;
  initialReading: number | null;
  securitySeal: string | null;
  connectionDiameter: string | null;
  location: GeoPointResponse | null;
  finalConditions: string | null;
  observations: string | null;
  clientSignatureUrl: string | null;
  isApproved: boolean | null;
  approvalDate: string | null;
  createdAt: string;

  approver: ApproverResponse | null;
  request: RequestDetailResponse;
  workOrder: WorkOrderDetailResponse;
}

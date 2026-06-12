import { InspectionReportModel } from '../schemas/models/InspectionReportModel';

export interface InterfaceInspectionReportRepository {
  createInspectionReport(
    report: InspectionReportModel,
  ): Promise<InspectionReportModel | null>;
  approveInspectionReport(
    reportId: string,
    approved: boolean,
    rejectionReason: string | null,
    approverId: string,
  ): Promise<{ solicitudId: string } | null>;
  getReportByWorkOrderId(
    workOrderId: string,
  ): Promise<InspectionReportModel | null>;
  closeWorkOrder(workOrderId: string, completedStatusId: number): Promise<void>;
  getClientIdBySolicitud(solicitudId: string): Promise<string | null>;
  getAnalystIdBySolicitud(solicitudId: string): Promise<string | null>;
  changeRequestStatus(
    solicitudId: string,
    newStatus: string,
    userId: string,
    comment: string,
  ): Promise<void>;
}

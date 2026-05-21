import { InspectionReportModel } from '../schemas/models/InspectionReportModel';

export interface InterfaceInspectionReportRepository {
  createInspectionReport(report: InspectionReportModel): Promise<InspectionReportModel | null>;
  approveInspectionReport(
    reportId: string,
    approved: boolean,
    rejectionReason: string | null,
    approverId: string,
  ): Promise<{ solicitudId: string } | null>;
  getReportByWorkOrderId(workOrderId: string): Promise<InspectionReportModel | null>;
  closeWorkOrder(workOrderId: string, completedStatusId: number): Promise<void>;
  changeRequestStatus(solicitudId: string, newStatus: string, userId: string, comment: string): Promise<void>;
}

import { InstallationReportResponse } from '../schemas/dto/response/installation-response';
import { InstallationReportModel } from '../schemas/models/InstallationReportModel';

export interface InterfaceInstallationReportRepository {
  createInstallationReport(
    report: InstallationReportModel,
  ): Promise<InstallationReportModel | null>;

  getReportByWorkOrderId(
    workOrderId: string,
  ): Promise<InstallationReportModel | null>;

  approveInstallationReport(
    reportId: string,
    approved: boolean,
    approverId: string,
  ): Promise<{ solicitudId: string } | null>;

  changeRequestStatus(
    solicitudId: string,
    newStatus: string,
    userId: string,
    comment: string,
  ): Promise<void>;

  closeWorkOrder(workOrderId: string, completedStatus: string, userId: string): Promise<void>;

  getClientIdBySolicitud(solicitudId: string): Promise<string | null>;
  getWorkOrderInstallationDetailByOrderCodeOrRequestNumber(
    orderCodeOrRequestNumber: string,
  ): Promise<InstallationReportResponse | null>;
}

import { InstallationReportModel } from '../../../domain/schemas/models/InstallationReportModel';

export class InstallationReportResponseDto {
  reportId: string | null;
  workOrderId: string;
  solicitudId: string | null;
  result: string;
  installationDate: string | null;
  meterNumber: string | null;
  initialReading: number | null;
  securitySeal: string | null;
  connectionDiameter: string | null;
  geomMeter: string | null;
  finalConditions: string | null;
  observations: string | null;
  clientSignatureUrl: string | null;
  approved: boolean | null;
  approverId: string | null;
  approvalDate: string | null;
  createdAt: string | null;
  updatedAt: string | null;

  constructor(model: InstallationReportModel) {
    this.reportId = model.reportId;
    this.workOrderId = model.workOrderId;
    this.solicitudId = model.solicitudId;
    this.result = model.result;
    this.installationDate = model.installationDate;
    this.meterNumber = model.meterNumber;
    this.initialReading = model.initialReading;
    this.securitySeal = model.securitySeal;
    this.connectionDiameter = model.connectionDiameter;
    this.geomMeter = model.geomMeter;
    this.finalConditions = model.finalConditions;
    this.observations = model.observations;
    this.clientSignatureUrl = model.clientSignatureUrl;
    this.approved = model.approved;
    this.approverId = model.approverId;
    this.approvalDate = model.approvalDate;
    this.createdAt = model.createdAt;
    this.updatedAt = model.updatedAt;
  }
}

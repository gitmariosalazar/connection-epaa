export class ApproveInstallationReportDto {
  reportId!: string;
  approved!: boolean;
  rejectionReason?: string;
  approverId!: string;
}

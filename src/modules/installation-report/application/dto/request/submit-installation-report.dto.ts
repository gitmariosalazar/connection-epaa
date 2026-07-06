export class SubmitInstallationReportDto {
  workOrderId!: string;
  result!: string;
  meterNumber?: string;
  initialReading?: number;
  securitySeal?: string;
  connectionDiameter?: string;
  geomMeter?: string;
  finalConditions?: string;
  observations?: string;
  clientSignatureUrl?: string;
}

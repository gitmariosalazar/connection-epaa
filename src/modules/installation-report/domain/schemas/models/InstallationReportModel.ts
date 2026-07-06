export class InstallationReportModel {
  constructor(
    public readonly reportId: string | null,
    public readonly workOrderId: string,
    public readonly solicitudId: string | null,
    public readonly result: string,
    public readonly installationDate: string | null,
    public readonly meterNumber: string | null,
    public readonly initialReading: number | null,
    public readonly securitySeal: string | null,
    public readonly connectionDiameter: string | null,
    public readonly geomMeter: string | null,
    public readonly finalConditions: string | null,
    public readonly observations: string | null,
    public readonly clientSignatureUrl: string | null,
    public readonly approved: boolean | null,
    public readonly approverId: string | null,
    public readonly approvalDate: string | null,
    public readonly createdAt: string | null,
    public readonly updatedAt: string | null,
  ) {}
}

export class InspectionReportModel {
  constructor(
    public readonly reportId: string | null,
    public readonly workOrderId: string,
    public readonly solicitudId: string,
    public readonly result: string,            // 'FACTIBLE' | 'NO_FACTIBLE'
    public readonly networkDistanceM: number | null,
    public readonly connectionDiameter: string | null,
    public readonly terrainConditions: string | null,
    public readonly observations: string | null,
    public readonly geomAcometida: string | null,
    public readonly materialCost: number | null,
    public readonly laborCost: number | null,
    public readonly approved: boolean | null,
    public readonly rejectionReason: string | null,
    public readonly approverId: string | null,
    public readonly approvalDate: Date | null,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
  ) {}
}

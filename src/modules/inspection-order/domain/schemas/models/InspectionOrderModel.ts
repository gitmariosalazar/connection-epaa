export class InspectionOrderModel {
  constructor(
    public readonly workOrderId: string | null,
    public readonly solicitudId: string,
    public readonly codigoOrden: string | null,
    public readonly technicianId: string | null,
    public readonly description: string,
    public readonly priorityId: number,
    public readonly scheduledDate: string | null,
    public readonly creatorId: string,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
  ) {}
}

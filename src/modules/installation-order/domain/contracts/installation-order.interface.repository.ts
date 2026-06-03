export interface InterfaceInstallationOrderRepository {
  /**
   * Crea la OT de instalación en work_orders y la vincula con la solicitud.
   */
  issueInstallationOrder(
    solicitudId: string,
    technicianId: string | null,
    description: string,
    priorityId: number,
    scheduledDate: string | null,
    creatorId: string,
  ): Promise<{ workOrderId: string; codigoOrden: string }>;

  /**
   * Inicia la OT de instalación (EN_PROCESO).
   */
  startInstallationOrder(
    workOrderId: string,
    technicianId: string,
    startStatusId: number,
  ): Promise<{ solicitudId: string } | null>;

  /**
   * Cierra la OT como completada.
   */
  completeInstallationOrder(
    workOrderId: string,
    completedStatusId: number,
  ): Promise<{ solicitudId: string } | null>;

  /**
   * Marca la OT como fallida.
   */
  failInstallationOrder(
    workOrderId: string,
    failedStatusId: number,
    failureReason: string,
  ): Promise<{ solicitudId: string } | null>;

  changeRequestStatus(
    solicitudId: string,
    newStatus: string,
    userId: string,
    comment: string,
  ): Promise<void>;

  getClientIdBySolicitud(solicitudId: string): Promise<string | null>;
}

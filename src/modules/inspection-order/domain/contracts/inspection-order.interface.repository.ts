export interface InterfaceInspectionOrderRepository {
  /**
   * Crea la orden de trabajo de inspección en work_orders y la vincula
   * con la solicitud en acometidas.solicitud_orden_trabajo.
   */
  issueInspectionOrder(
    solicitudId: string,
    technicianId: string | null,
    description: string,
    priorityId: number,
    scheduledDate: string | null,
    creatorId: string,
  ): Promise<{ workOrderId: string; codigoOrden: string }>;

  /**
   * Actualiza el estado de la OT a EN_PROCESO.
   * Devuelve el solicitudId vinculado para poder transicionar el workflow.
   */
  startInspectionOrder(
    workOrderId: string,
    technicianId: string,
    startStatusId: number,
  ): Promise<{ solicitudId: string } | null>;

  /** Transiciona el estado de la solicitud vía fn_cambiar_estado_solicitud */
  changeRequestStatus(
    solicitudId: string,
    newStatus: string,
    userId: string,
    comment: string,
  ): Promise<void>;

  /** Obtiene el id_cliente para notificaciones */
  getClientIdBySolicitud(solicitudId: string): Promise<string | null>;

  /** Obtiene la dirección de la solicitud para notificaciones */
  getAddressBySolicitud(solicitudId: string): Promise<string | null>;
}

export interface InterfacePaymentConfirmationRepository {
  /** Marca la factura como PAGADO y devuelve el id_solicitud relacionado */
  confirmInvoicePayment(
    invoiceId: string,
    paymentMethod: string,
    paymentReference: string,
    proofOfPaymentUrl: string | null,
    collectorId: string,
  ): Promise<string | null>; // Devuelve el id_solicitud

  /** Transición de estado vía función de la BD */
  changeRequestStatus(
    solicitudId: string,
    newStatus: string,
    userId: string,
    comment: string,
  ): Promise<void>;

  /** Devuelve el usuario_id del cliente dueño de la solicitud */
  getClientIdBySolicitud(solicitudId: string): Promise<string | null>;
}

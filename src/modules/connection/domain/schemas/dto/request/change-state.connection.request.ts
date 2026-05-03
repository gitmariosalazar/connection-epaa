export interface ChangeConnectionStateRequest {
  connectionId: string;
  newStateId: number;
  userId: string;
  motivo: string;
  detallesTecnicos?: Record<string, any>;
}

export interface BulkChangeConnectionStateRequest {
  connectionIds: string[];
  newStateId: number;
  userId: string;
  motivo: string;
}

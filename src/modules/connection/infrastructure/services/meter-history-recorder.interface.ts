import { IDatabaseClient } from '../../../../shared/connections/database/abstract/abstract.database';

export type MeterHistoryOperation = 'INSERT' | 'UPDATE';

export interface MeterChangeContext {
  connectionId: string;
  clientId: string | null;
  previousMeterNumber: string | null;
  newMeterNumber: string | null;
  operation: MeterHistoryOperation;
  // Metadatos adicionales del cambio (p. ej. lecturas anterior/nueva); se persiste tal cual en detalles_cambio
  changeDetails?: Record<string, unknown> | null;
}

/**
 * Port for recording meter number changes into historial_medidores.
 * Replaces the former DB trigger fn_registrar_historial_medidor: the rule now
 * lives in the backend and must run inside the same transaction as the
 * acometida INSERT/UPDATE that triggers it.
 */
export interface IMeterHistoryRecorder {
  recordMeterChange(
    client: IDatabaseClient,
    context: MeterChangeContext,
  ): Promise<void>;
}

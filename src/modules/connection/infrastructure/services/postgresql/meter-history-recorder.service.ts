import { Injectable } from '@nestjs/common';
import { IDatabaseClient } from '../../../../../shared/connections/database/abstract/abstract.database';
import {
  IMeterHistoryRecorder,
  MeterChangeContext,
  MeterHistoryOperation,
} from '../meter-history-recorder.interface';

@Injectable()
export class MeterHistoryPostgresRecorder implements IMeterHistoryRecorder {
  async recordMeterChange(
    client: IDatabaseClient,
    context: MeterChangeContext,
  ): Promise<string | null> {
    const { connectionId, clientId, operation } = context;
    const previous = this.normalize(context.previousMeterNumber);
    const next = this.normalize(context.newMeterNumber);

    // Mismas reglas de omisión que el antiguo trigger fn_registrar_historial_medidor
    // if (operation === 'UPDATE' && previous === next) return null;
    if (operation === 'INSERT' && next === null) return null;

    const now = new Date();
    const meterBefore =
      operation === 'INSERT'
        ? 'NUEVA ACOMETIDA (SIN MEDIDOR)'
        : (previous ?? 'SIN MEDIDOR');
    const meterAfter =
      operation === 'UPDATE' && next === null ? 'RETIRADO' : next;
    const observation = this.buildObservation(operation, previous, next);

    await client.query(
      `UPDATE public.historial_medidores
         SET estado = 'INACTIVO', fecha_desinstalacion = ?, updated_at = ?, user_updated = ?
       WHERE id_acometida = ? AND estado = 'ACTIVO'`,
      [now, now, context.userId ?? null, connectionId],
    );

    const inserted = await client.query<any>(
      `INSERT INTO public.historial_medidores (
         id_cliente, id_acometida, numero_medidor_anterior, numero_medidor_nuevo,
         fecha_instalacion, fecha_desinstalacion, estado, observacion, detalles_cambio, user_created,
         created_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, NULL, 'ACTIVO', ?, ?::jsonb, ?, ?, ?)
       RETURNING *`,
      [
        clientId,
        connectionId,
        meterBefore,
        meterAfter,
        now,
        observation,
        JSON.stringify(context.changeDetails ?? {}),
        context.userId ?? null,
        now,
        now,
      ],
    );

    console.log('DEBUG inserted result in meter history:', inserted);

    return inserted[0]?.id_historial_medidor ?? inserted[0]?.historial_medidor_id ?? null;
  }

  private normalize(value: string | null | undefined): string | null {
    return value && value.trim().length > 0 ? value : null;
  }

  private buildObservation(
    operation: MeterHistoryOperation,
    previous: string | null,
    next: string | null,
  ): string {
    if (operation === 'INSERT') {
      return 'Asignación de medidor inicial en nueva acometida.';
    }
    if (previous === null) {
      return 'Asignación de primer medidor.';
    }
    if (next === null) {
      return 'Desinstalación y retiro de medidor.';
    }
    return `Reemplazo de medidor: ${previous} por ${next}.`;
  }
}

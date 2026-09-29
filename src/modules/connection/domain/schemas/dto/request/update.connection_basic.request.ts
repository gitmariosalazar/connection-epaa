import { MeterChangePhotoInput } from './change-meter.connection.request';

export class UpdateConnectionBasicRequest {
  connectionId?: string;
  meterNumber?: string;
  photosFacade?: MeterChangePhotoInput[];
  photosMeter?: MeterChangePhotoInput[];
  description?: string;
  userId?: string; // ID del usuario que realiza el cambio, para historial_medidores
}

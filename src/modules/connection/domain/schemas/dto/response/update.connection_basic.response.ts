export interface UpdatedBasicConnectionPhoto {
  photoConnectionId: number;
  photoUrl: string;
  photoType: 'FACHADA' | 'MEDIDOR';
  description?: string | null;
}

export class UpdateConnectionBasicResponse {
  connectionId: string;
  meterNumber: string | null;
  historialMedidorId?: string | null;
  photosFacade: UpdatedBasicConnectionPhoto[];
  photosMeter: UpdatedBasicConnectionPhoto[];
}

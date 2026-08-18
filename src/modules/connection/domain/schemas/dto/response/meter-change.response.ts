export interface MeterChangePhotoResponse {
  imageUrl: string;
  description: string | null;
}

export interface MeterChangeResponse {
  connectionId: string;
  previousMeterNumber: string | null;
  newMeterNumber: string;
  historialMedidorId: string;
  photos: MeterChangePhotoResponse[];
}

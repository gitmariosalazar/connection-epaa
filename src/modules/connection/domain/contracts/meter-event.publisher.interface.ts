export interface MeterChangedEventPayload {
  acometidaId: string;
  nuevoNumeroMedidor: string;
  sector: number;
  cuenta: number;
  claveCatastral: string;
  fechaInicioLecturas: Date | string;
}

export interface IMeterEventPublisher {
  publishMeterChangedEvent(payload: MeterChangedEventPayload): void;
}

export class CreateObservationConnectionRequest {
  observationId: number;
  connectionId: string;
  observationTitle: string;
  observationDetails: string;

  constructor(
    observationId: number,
    connectionId: string,
    observationTitle: string,
    observationDetails: string,
  ) {
    this.observationId = observationId;
    this.connectionId = connectionId;
    this.observationTitle = observationTitle;
    this.observationDetails = observationDetails;
  }
}
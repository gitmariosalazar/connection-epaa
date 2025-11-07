export class ObservationModel {
  private observationId: number;
  private observationTitle: string;
  private observationDetails: string;

  constructor(observationId: number, observationTitle: string, observationDetails: string) {
    this.observationId = observationId;
    this.observationTitle = observationTitle;
    this.observationDetails = observationDetails;
  }

  public getObservationId(): number {
    return this.observationId;
  }

  public getObservationTitle(): string {
    return this.observationTitle;
  }

  public getObservationDetails(): string {
    return this.observationDetails;
  }
  public setObservationId(observationId: number): void {
    this.observationId = observationId;
  }

  public setObservationTitle(observationTitle: string): void {
    this.observationTitle = observationTitle;
  }

  public setObservationDetails(observationDetails: string): void {
    this.observationDetails = observationDetails;
  }
}
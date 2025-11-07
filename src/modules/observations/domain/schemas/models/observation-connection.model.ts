import { ObservationModel } from "./observation.model";

export class ObservationConnectionModel {
  private observationConnectionId: number;
  private connectionId: string;
  private observation: ObservationModel;

  constructor(
    observationConnectionId: number,
    connectionId: string,
    observation: ObservationModel,
  ) {
    this.observationConnectionId = observationConnectionId;
    this.connectionId = connectionId;
    this.observation = observation;
  }

  public getObservationConnectionId(): number {
    return this.observationConnectionId;
  }

  public getConnectionId(): string {
    return this.connectionId;
  }

  public getObservation(): ObservationModel {
    return this.observation;
  }

  public setObservationConnectionId(observationConnectionId: number): void {
    this.observationConnectionId = observationConnectionId;
  }

  public setConnectionId(connectionId: string): void {
    this.connectionId = connectionId;
  }

  public setObservation(observation: ObservationModel): void {
    this.observation = observation;
  }
}
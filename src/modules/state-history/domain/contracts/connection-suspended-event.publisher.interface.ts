export interface ConnectionSuspendedEventPayload {
  eventId: string;
  eventType: 'CONNECTION_SUSPENDED';
  timestamp: string;
  data: {
    connectionId: string;
    sector: number;
    account: number;
    cadastralKey: string;
    stateId: number;
    stateName: string;
    reason: string;
    userId: string;
    effectiveDate: string;
    state: 'SUSPENDIDO' | 'NORMAL';
  };
}

export interface IConnectionSuspendedEventPublisher {
  publishSuspendedEvent(event: ConnectionSuspendedEventPayload): Promise<void>;
}

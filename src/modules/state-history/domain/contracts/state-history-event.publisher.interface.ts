export interface ConnectionStateChangedEventPayload {
  eventId: string;
  eventType: 'CONNECTION_STATE_CHANGED';
  timestamp: string;
  data: {
    historialId: number;
    connectionId: string;
    previousState: {
      id: number | null;
      name: string;
      allowsBilling: boolean;
      allowsReading: boolean;
      requiresInspection: boolean;
    } | null;
    newState: {
      id: number;
      name: string;
      allowsBilling: boolean;
      allowsReading: boolean;
      requiresInspection: boolean;
    };
    effectiveDate: string;
    userId: string;
    origin: string;
    location: {
      latitude: number;
      longitude: number;
    } | null;
    isReversal: boolean;
  };
}

export interface IStateHistoryEventPublisher {
  publishStateChangedEvent(event: ConnectionStateChangedEventPayload): void;
}

export interface LegacySuspensionPayload {
  sector: number;
  account: number;
  description: string;
  state: 'SUSPENDIDO' | 'NORMAL';
}

export interface ILegacySuspensionEventPublisher {
  publishSuspensionToLegacy(payload: LegacySuspensionPayload): void;
}

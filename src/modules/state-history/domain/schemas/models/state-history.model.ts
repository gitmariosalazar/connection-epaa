import { StateHistoryOriginEnum } from '../../enums/state-history.enums';
import { GeoPoint } from './geo-point.model';

export class StateHistoryModel {
  constructor(
    public readonly historialId: number | null,
    public readonly connectionId: string,
    public readonly previousStateId: number | null,
    public readonly newStateId: number,
    public readonly changeDate: Date,
    public readonly effectiveDate: Date,
    public readonly reason: string | null,
    public readonly supportDocument: string | null,
    public readonly observations: string | null,
    public readonly userId: string,
    public readonly origin: StateHistoryOriginEnum,
    public readonly ipAddress: string | null,
    public readonly deviceId: string | null,
    public readonly location: GeoPoint | null,
    public readonly isReversal: boolean,
    public readonly originHistoryId: number | null,
    public readonly createdAt: Date,
    // Joined audit metadata (optional)
    public readonly previousStateName?: string | null,
    public readonly newStateName?: string | null,
    public readonly allowsBilling?: boolean | null,
    public readonly allowsReading?: boolean | null,
    public readonly requiresInspection?: boolean | null,
    public readonly userEmail?: string | null,
    public readonly userFullName?: string | null,
    public readonly idDocumento?: string | null,
  ) {}
}

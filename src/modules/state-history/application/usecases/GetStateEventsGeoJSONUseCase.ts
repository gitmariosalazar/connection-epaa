import { Inject, Injectable } from '@nestjs/common';
import { InterfaceStateHistoryRepository } from '../../domain/contracts/state-history.interface.repository';
import { StateEventsGeoJSONResponse, GeoJSONFeature } from '../dto/response/geo-events.response';

export interface GetStateEventsGeoJSONFilter {
  stateId?: number;
  sectorId?: number;
  startDate?: string;
  endDate?: string;
}

@Injectable()
export class GetStateEventsGeoJSONUseCase {
  constructor(
    @Inject('InterfaceStateHistoryRepository')
    private readonly repository: InterfaceStateHistoryRepository,
  ) {}

  async execute(filter: GetStateEventsGeoJSONFilter): Promise<StateEventsGeoJSONResponse> {
    const startDate = filter.startDate ? new Date(filter.startDate) : undefined;
    const endDate = filter.endDate ? new Date(filter.endDate) : undefined;

    const items = await this.repository.findGeoEvents(
      filter.stateId,
      filter.sectorId,
      startDate,
      endDate,
    );

    const features: GeoJSONFeature[] = items.map((item) => ({
      type: 'Feature',
      geometry: item.geoJson,
      properties: {
        historialId: item.historialId,
        connectionId: item.connectionId,
        sector: item.sector,
        stateId: item.stateId,
        stateName: item.stateName,
        effectiveDate: item.effectiveDate.toISOString(),
        reason: item.reason,
        supportDocument: item.supportDocument,
      },
    }));

    return {
      type: 'FeatureCollection',
      totalFeatures: features.length,
      features,
    };
  }
}

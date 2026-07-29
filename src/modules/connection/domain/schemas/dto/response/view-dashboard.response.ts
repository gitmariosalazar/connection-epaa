export interface ClientDashboardResponse {
  clientId: string;
  identification: string;
  clientName: string;
  clientType: string;

  infrastructure: {
    totalConnections: number;
    activeConnections: number;
    installedMeters: number;
    withSewerService: number;
  };

  consumption: {
    readingHistoryCount: number;
    averageConsumptionM3: number;
    lastReadingDate: string | null;
    consumptionProfile: string;
  };

  processes: {
    totalRequests: number;
    pendingRequests: number;
    totalWorkOrders: number;
    activeWorkOrders: number;
    totalIncidents: number;
    pendingIncidents: number;
  };

  financials: {
    invoiceCount: number;
    totalInvoicedAmount: number;
    currentDebtAmount: number;
    healthStatus: string;
  };

  clientSinceDate: string;
}

export interface ConnectionReadingHistoryDto {
  date: string;
  previousReading: number;
  currentReading: number;
  consumptionM3: number;
  anomalyNovelty: string | null;
}

export interface ConnectionIncidentDto {
  reportDate: string;
  status: string;
  description: string;
  priority: string;
}

export interface ConnectionDashboardResponse {
  connectionId: string;
  cadastralKey: string;
  status: string;
  hasSewerService: boolean;
  latitude: number | null;
  longitude: number | null;

  client: {
    identification: string;
    name: string;
    clientId: string;
  };

  address: string;

  meter: {
    serial: string;
    brand: string;
    diameterMm: number;
  };

  consumption: {
    totalReadingsCount: number;
    lastConsumptionM3: number;
    historicalAverageM3: number;
    lastReadingDate: string | null;
    history: ConnectionReadingHistoryDto[];
    automaticAlert: string;
  };

  incidents: {
    totalCount: number;
    pendingCount: number;
    latest: ConnectionIncidentDto[];
  };
}

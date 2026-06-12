export interface DashboardAdvanceResponse {
  resumen: {
    total_universo: number;
    pct_progreso_total: number; // Ahora garantizado como number
    actualizaciones_hoy: number;
  };
  historico: Array<{
    fecha: string;
    registros_completados: number;
  }>;
  distribucion: Array<{
    categoria: string;
    cantidad: number;
  }>;
  porZonas: Array<{
    zona_id: number;
    total: number;
    completados: number;
    pendientes: number;
  }>;
  distribucionTarifas: Array<{
    tarifa: string;
    cantidad: number;
  }>;
  coberturaAlcantarillado: {
    con_alcantarillado: number;
    sin_alcantarillado: number;
  };
  calidadGps: {
    precision_promedio: number;
  };
  instalacionesRecientesCoords: Array<{
    coordenadas: string;
    fecha: string;
  }>;
  curvaCrecimiento: Array<{
    mes: string;
    nuevas_acometidas: number;
  }>;
  poblacionServida: {
    total_habitantes: number;
  };
  coberturaMedidores: {
    con_medidor: number;
    sin_medidor: number;
  };
  estadoRed: {
    activas: number;
    inactivas: number;
  };
  // Agregamos el embudo de calidad para el Funnel Chart
  embudo: Array<{
    paso: string;
    total: number;
  }>;
  porSectores: Array<{
    sector: number;
    total: number;
    totalActualizadas: number;
    pendientes: number;
    porcentaje: number;
    sinGeolocalizacion: number;
    sinPredio: number;
    sinCliente: number;
  }>;
}

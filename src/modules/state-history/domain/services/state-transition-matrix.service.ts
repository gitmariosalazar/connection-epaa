import { ConnectionStateEnum } from '../enums/state-history.enums';

export type TransitionStatus = 'ALLOWED' | 'RESTRICTED' | 'FORBIDDEN';

export interface TransitionRule {
  status: TransitionStatus;
  note?: string;
  requiresInspection?: boolean;
  requiresAdminPrivilege?: boolean;
}

export interface AllowedTargetState {
  targetStateId: number;
  targetStateName: string;
  status: TransitionStatus;
  note?: string;
}

export class StateTransitionMatrixService {
  private static readonly STATE_NAMES: Record<number, string> = {
    1: 'ACTIVA',
    2: 'NUEVA_PENDIENTE',
    3: 'SUSPENDIDA_VOLUNTARIA',
    4: 'CORTADA_POR_MORA',
    5: 'CLAUSURADA',
    6: 'ANULADA_SOLICITUD',
    7: 'BAJA_ADMINISTRATIVA',
    8: 'IRREGULAR_FRAUDE',
    9: 'DAÑO_TECNICO',
    10: 'PAGO_PENDIENTE_RECONEXION',
    11: 'EN_REPARACION',
    12: 'EN_REVISION_CATASTRAL',
    13: 'SUSPENDIDO',
    14: 'INACTIVA',
    15: 'RETIRADA',
  };

  /**
   * Official 15x15 Transition Matrix specified in Section 5.1 of technical specification.
   * Key: Source State ID (or 0 for initial creation / NULL).
   * Value: Map of Target State ID -> TransitionRule
   */
  private static readonly MATRIX: Record<number, Record<number, TransitionRule>> = {
    // 0: Initial Creation / Migration / Previous NULL
    0: {
      1: { status: 'RESTRICTED', note: 'Migración de acometida activa preexistente' },
      2: { status: 'ALLOWED', note: 'Nueva solicitud aprobada pendiente de instalación' },
      12: { status: 'RESTRICTED', note: 'Migración de acometida en revisión catastral' },
      13: { status: 'RESTRICTED', note: 'Migración de acometida suspendida' },
      14: { status: 'ALLOWED', note: 'Línea base histórica: Regularización de estados nulos' },
    },

    // 1: ACTIVA
    1: {
      3: { status: 'ALLOWED', note: 'Suspensión voluntaria por inmueble desocupado' },
      4: { status: 'ALLOWED', note: 'Corte coercitivo por morosidad acumulada' },
      5: { status: 'ALLOWED', note: 'Clausura por abandono prolongado' },
      6: { status: 'ALLOWED', note: 'Cierre definitivo a solicitud del titular / demolición' },
      7: { status: 'RESTRICTED', note: 'Baja administrativa por duplicidad catastral', requiresAdminPrivilege: true },
      8: { status: 'ALLOWED', note: 'Detección de fraude, bypass o alteración de medidor' },
      9: { status: 'ALLOWED', note: 'Fuga interna o rotura técnica de acometida' },
      11: { status: 'ALLOWED', note: 'Mantenimiento o intervención técnica correctiva' },
      12: { status: 'ALLOWED', note: 'Discrepancia en censo o catastro' },
      13: { status: 'ALLOWED', note: 'Suspensión administrativa o cautelar general' },
      14: { status: 'RESTRICTED', note: 'Inactivación administrativa de servicio', requiresAdminPrivilege: true },
      15: { status: 'RESTRICTED', note: 'Retiro físico definitivo del medidor con OT', requiresInspection: true },
    },

    // 2: NUEVA_PENDIENTE
    2: {
      1: { status: 'ALLOWED', note: 'Instalación física exitosa y medidor colocado (OT)', requiresInspection: true },
      6: { status: 'ALLOWED', note: 'Desistimiento de trámite de instalación' },
      7: { status: 'ALLOWED', note: 'Factibilidad técnica negativa o trámite improcedente' },
      12: { status: 'ALLOWED', note: 'Revisión catastral de predio en estudio' },
      14: { status: 'ALLOWED', note: 'Caducidad de trámite sin instalación' },
    },

    // 3: SUSPENDIDA_VOLUNTARIA
    3: {
      1: { status: 'ALLOWED', note: 'Reactivación ordinaria a petición del cliente' },
      6: { status: 'ALLOWED', note: 'Cierre definitivo solicitado' },
      7: { status: 'RESTRICTED', note: 'Baja administrativa', requiresAdminPrivilege: true },
      8: { status: 'ALLOWED', note: 'Detección de consumo clandestino durante suspensión' },
      10: { status: 'ALLOWED', note: 'Solicitud de reactivación sujeta a verificación' },
      12: { status: 'ALLOWED', note: 'Inspección catastral' },
      14: { status: 'RESTRICTED', note: 'Pase a inactiva por vencimiento prolongado', requiresAdminPrivilege: true },
      15: { status: 'RESTRICTED', note: 'Retiro definitivo de medidor por desocupación total', requiresInspection: true },
    },

    // 4: CORTADA_POR_MORA
    4: {
      1: { status: 'RESTRICTED', note: 'Reconexión directa sin registro formal de pago (Requiere autorización excepcional)', requiresAdminPrivilege: true },
      5: { status: 'ALLOWED', note: 'Clausura por mora irreversible' },
      7: { status: 'RESTRICTED', note: 'Baja administrativa por cobro coactivo fallido', requiresAdminPrivilege: true },
      8: { status: 'ALLOWED', note: 'Reconexión clandestina no autorizada con sello roto' },
      10: { status: 'ALLOWED', note: 'Pago de planillas vencidas / convenio suscrito' },
      12: { status: 'ALLOWED', note: 'Auditoría catastral de predio con corte' },
      15: { status: 'ALLOWED', note: 'Retiro físico de medidor por morosidad mayor a 12 meses', requiresInspection: true },
    },

    // 5: CLAUSURADA
    5: {
      1: { status: 'RESTRICTED', note: 'Reapertura excepcional autorizada', requiresAdminPrivilege: true },
      7: { status: 'ALLOWED', note: 'Baja administrativa definitiva' },
      8: { status: 'ALLOWED', note: 'Fraude detectado sobre clausura' },
      12: { status: 'ALLOWED', note: 'Revisión catastral' },
      15: { status: 'ALLOWED', note: 'Levantamiento y retiro de medidor', requiresInspection: true },
    },

    // 6: ANULADA_SOLICITUD
    6: {
      1: { status: 'RESTRICTED', note: 'Nuevo contrato sobre acometida previamente anulada', requiresAdminPrivilege: true },
      7: { status: 'ALLOWED', note: 'Baja catastral confirmada' },
      14: { status: 'ALLOWED', note: 'Archivo como conexión inactiva' },
      15: { status: 'ALLOWED', note: 'Retiro físico de medidor por demolición de predio', requiresInspection: true },
    },

    // 7: BAJA_ADMINISTRATIVA
    7: {
      1: { status: 'RESTRICTED', note: 'Subsanación excepcional de error en catastro', requiresAdminPrivilege: true },
    },

    // 8: IRREGULAR_FRAUDE
    8: {
      4: { status: 'ALLOWED', note: 'Aplicación de corte físico tras acta de infracción' },
      5: { status: 'ALLOWED', note: 'Clausura preventiva' },
      7: { status: 'RESTRICTED', note: 'Baja administrativa', requiresAdminPrivilege: true },
      10: { status: 'ALLOWED', note: 'Cancelación de sanción pecuniaria y convenio' },
      12: { status: 'ALLOWED', note: 'Peritaje catastral' },
      13: { status: 'ALLOWED', note: 'Suspensión cautelar de servicio' },
      15: { status: 'ALLOWED', note: 'Retiro físico de medidor por reincidencia de fraude', requiresInspection: true },
    },

    // 9: DAÑO_TECNICO
    9: {
      1: { status: 'ALLOWED', note: 'Servicio restablecido tras prueba hidráulica' },
      7: { status: 'RESTRICTED', note: 'Baja administrativa', requiresAdminPrivilege: true },
      11: { status: 'ALLOWED', note: 'Cuadrilla técnica en sitio ejecutando reparación' },
      15: { status: 'RESTRICTED', note: 'Retiro por daño irreparable de ramal', requiresInspection: true },
    },

    // 10: PAGO_PENDIENTE_RECONEXION
    10: {
      1: { status: 'ALLOWED', note: 'Cuadrilla retira precinto y confirma reconexión física exitosa', requiresInspection: true },
      4: { status: 'RESTRICTED', note: 'Re-corte por reversión o rechazo de pago bancario', requiresAdminPrivilege: true },
      8: { status: 'ALLOWED', note: 'Detección de fraude al momento de la reconexión' },
    },

    // 11: EN_REPARACION
    11: {
      1: { status: 'ALLOWED', note: 'Reparación finalizada y servicio restablecido' },
      7: { status: 'RESTRICTED', note: 'Baja administrativa', requiresAdminPrivilege: true },
    },

    // 12: EN_REVISION_CATASTRAL
    12: {
      1: { status: 'ALLOWED', note: 'Validación catastral conforme con servicio activo' },
      7: { status: 'ALLOWED', note: 'Confirmación de registro duplicado o inexistente' },
      8: { status: 'ALLOWED', note: 'Detección de irregularidad durante inspección censal' },
      14: { status: 'ALLOWED', note: 'Confirmación de predio sin toma activa de agua' },
      15: { status: 'RESTRICTED', note: 'Retiro de equipo no censado', requiresInspection: true },
    },

    // 13: SUSPENDIDO
    13: {
      1: { status: 'ALLOWED', note: 'Levantamiento de medida cautelar o suspensión' },
      4: { status: 'ALLOWED', note: 'Pase a corte coercitivo por mora' },
      5: { status: 'ALLOWED', note: 'Clausura' },
      7: { status: 'ALLOWED', note: 'Baja administrativa' },
      8: { status: 'ALLOWED', note: 'Detección de fraude' },
      12: { status: 'ALLOWED', note: 'Revisión catastral' },
      14: { status: 'ALLOWED', note: 'Inactivación' },
      15: { status: 'ALLOWED', note: 'Retiro definitivo de medidor', requiresInspection: true },
    },

    // 14: INACTIVA
    14: {
      1: { status: 'RESTRICTED', note: 'Reactivación directa con inspección previa obligatoria', requiresInspection: true },
      2: { status: 'ALLOWED', note: 'Nueva solicitud formal de factibilidad y contrato' },
      7: { status: 'ALLOWED', note: 'Depuración definitiva de catastro' },
      12: { status: 'ALLOWED', note: 'Inspección de campo / censo para regularización' },
      15: { status: 'ALLOWED', note: 'Desmonte y limpieza de instalaciones remanentes', requiresInspection: true },
    },

    // 15: RETIRADA
    15: {
      1: { status: 'RESTRICTED', note: 'Nuevo contrato + OT formal de reinstalación de medidor', requiresInspection: true, requiresAdminPrivilege: true },
      2: { status: 'ALLOWED', note: 'Nueva solicitud formal de factibilidad técnica' },
      7: { status: 'ALLOWED', note: 'Baja catastral definitiva' },
      12: { status: 'ALLOWED', note: 'Verificación catastral de predio con medidor retirado' },
      14: { status: 'RESTRICTED', note: 'Inactivación de punto sin reinstalación', requiresAdminPrivilege: true },
    },
  };

  /**
   * Validates if a transition from source state to target state is permissible.
   */
  public static validateTransition(
    fromStateId: number | null,
    toStateId: number,
  ): { isValid: boolean; status: TransitionStatus; message: string; requiresInspection: boolean } {
    if (fromStateId !== null && fromStateId === toStateId) {
      return {
        isValid: false,
        status: 'FORBIDDEN',
        message: `Transition to the same state (${fromStateId}) is prohibited by database check constraint chk_acometida_estado_hist_cambio_real.`,
        requiresInspection: false,
      };
    }

    const sourceKey = fromStateId ?? 0;
    const sourceRules = this.MATRIX[sourceKey];
    if (!sourceRules) {
      return {
        isValid: false,
        status: 'FORBIDDEN',
        message: `Unknown source state ID: ${fromStateId}`,
        requiresInspection: false,
      };
    }

    const rule = sourceRules[toStateId];
    if (!rule) {
      const fromName = fromStateId ? this.STATE_NAMES[fromStateId] ?? `ID ${fromStateId}` : 'NULL';
      const toName = this.STATE_NAMES[toStateId] ?? `ID ${toStateId}`;
      return {
        isValid: false,
        status: 'FORBIDDEN',
        message: `Transition from state ${fromName} (${fromStateId}) to ${toName} (${toStateId}) is strictly prohibited by business transition rules.`,
        requiresInspection: false,
      };
    }

    return {
      isValid: true,
      status: rule.status,
      message: rule.note ?? `Transition allowed (${rule.status})`,
      requiresInspection: rule.requiresInspection ?? false,
    };
  }

  /**
   * Returns all permissible target states for a given source state.
   */
  public static getAllowedTargetStates(fromStateId: number | null): AllowedTargetState[] {
    const sourceKey = fromStateId ?? 0;
    const sourceRules = this.MATRIX[sourceKey] ?? {};

    return Object.entries(sourceRules).map(([targetIdStr, rule]) => {
      const targetStateId = Number(targetIdStr);
      return {
        targetStateId,
        targetStateName: this.STATE_NAMES[targetStateId] ?? `STATE_${targetStateId}`,
        status: rule.status,
        note: rule.note,
      };
    });
  }

  public static getStateName(stateId: number): string {
    return this.STATE_NAMES[stateId] ?? `UNKNOWN_STATE_${stateId}`;
  }
}

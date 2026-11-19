export interface AllowedTransitionOption {
  targetStateId: number;
  targetStateName: string;
  status: 'ALLOWED' | 'RESTRICTED' | 'FORBIDDEN';
  note?: string;
}

export interface AllowedTransitionsResponse {
  connectionId: string;
  currentStateId: number | null;
  currentStateName: string;
  allowedTransitions: AllowedTransitionOption[];
}

export interface RateResponse {
  rateId: number;
  rateName: string;
  rateDescription: string;
  effectiveDate: Date;
  endDate: Date | null;
}

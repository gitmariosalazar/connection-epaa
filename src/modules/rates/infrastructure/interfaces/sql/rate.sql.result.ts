export interface RateSQLResult {
  rate_id: number;
  rate_name: string;
  rate_description: string;
  effective_date: Date;
  end_date: Date | null;
}

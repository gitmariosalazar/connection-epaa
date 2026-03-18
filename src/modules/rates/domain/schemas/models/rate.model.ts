/*
SELECT 
	t.tarifa_id AS rate_id,
    c.nombre AS category_name,
    t.descripcion AS category_description,
    t.effective_date AS effective_date,
    t.end_date AS end_date
FROM categoria c
INNER JOIN tarifa t ON c.categoria_id = t.categoria_id
WHERE CURRENT_DATE >= t.effective_date 
  AND (t.end_date IS NULL OR t.end_date >= CURRENT_DATE);
*/

export class RateModel {
  constructor(
    public readonly rateId: number,
    public readonly rateName: string,
    public readonly rateDescription: string,
    public readonly effectiveDate: Date,
    public readonly endDate: Date | null,
  ) {}
}

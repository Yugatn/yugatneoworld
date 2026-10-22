/** Labor domain: deterministic, privacy-conscious primitives. No universal citizen score. */
export type Vacancy = { id: string; organizationId: string; title: string; description: string; location: string; salaryMin?: number; salaryMax?: number; currency?: string; status: "draft" | "open" | "closed" };
export type WorkReview = { id: string; engagementId: string; authorId: string; subjectId: string; dimension: "payment" | "conditions" | "delivery" | "communication"; rating: 1 | 2 | 3 | 4 | 5; verified: boolean; disputed?: boolean };
export type Reputation = { dimension: WorkReview["dimension"]; sampleSize: number; average: number | null; status: "insufficient_data" | "provisional" };
export function validateVacancy(v: Vacancy): string[] {
  const errors: string[] = [];
  if (!v.id.trim() || !v.organizationId.trim()) errors.push("missing_identity");
  if (v.title.trim().length < 3 || v.title.length > 140) errors.push("invalid_title");
  if (v.description.trim().length < 20 || v.description.length > 10000) errors.push("invalid_description");
  if (!["draft", "open", "closed"].includes(v.status)) errors.push("invalid_status");
  if ((v.salaryMin !== undefined && (!Number.isFinite(v.salaryMin) || v.salaryMin < 0)) || (v.salaryMax !== undefined && (!Number.isFinite(v.salaryMax) || v.salaryMax < 0))) errors.push("invalid_salary");
  if (v.salaryMin !== undefined && v.salaryMax !== undefined && v.salaryMin > v.salaryMax) errors.push("salary_range");
  return errors;
}
export function calculateReputation(reviews: readonly WorkReview[], subjectId: string, dimension: WorkReview["dimension"], minimum = 5): Reputation {
  const eligible = reviews.filter(r => r.subjectId === subjectId && r.dimension === dimension && r.verified && !r.disputed && Number.isInteger(r.rating) && r.rating >= 1 && r.rating <= 5);
  const distinct = new Map<string, WorkReview>();
  for (const r of eligible) distinct.set(r.engagementId, r);
  const values = [...distinct.values()];
  return { dimension, sampleSize: values.length, average: values.length >= minimum ? Math.round(values.reduce((s, r) => s + r.rating, 0) / values.length * 100) / 100 : null, status: values.length >= minimum ? "provisional" : "insufficient_data" };
}
export function searchVacancies(vacancies: readonly Vacancy[], query: string): Vacancy[] {
  const needle = query.trim().toLocaleLowerCase();
  return vacancies.filter(v => v.status === "open" && (!needle || [v.title, v.description, v.location].some(s => s.toLocaleLowerCase().includes(needle))));
}

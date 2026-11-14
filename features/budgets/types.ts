import { z } from "zod";

export const budgetFormSchema = z.object({
  categoryId: z.string().uuid("Please select a category"),
  limitAmount: z.string().refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num > 0;
  }, "Budget limit must be greater than zero"),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2024),
});

export type BudgetFormData = z.infer<typeof budgetFormSchema>;


import { z } from "zod";

export const transactionFormSchema = z.object({
  accountId: z.string().uuid("Please select an account"),
  categoryId: z.string().uuid("Please select a category").optional().nullable(),
  destinationAccountId: z.string().uuid("Please select destination account").optional().nullable(),
  amount: z.string().refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num > 0;
  }, "Amount must be greater than zero"),
  type: z.enum(["income", "expense", "transfer"]),
  description: z.string().min(1, "Description is required"),
  notes: z.string().optional(),
  transactionDate: z.string(),
});

export type TransactionFormData = z.infer<typeof transactionFormSchema>;


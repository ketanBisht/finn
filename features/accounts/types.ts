import { z } from "zod";

export const accountFormSchema = z.object({
  name: z.string().min(1, "Account name is required"),
  type: z.enum(["cash", "savings", "current", "other"]),
  openingBalance: z.string().default("0"),
  currency: z.string().default("INR"),
});

export type AccountFormData = z.infer<typeof accountFormSchema>;


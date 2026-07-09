import { z } from 'zod';

export const createCompanySchema = z.object({
  name: z.string().min(2, 'Название должно содержать минимум 2 символа'),
  code: z.string().min(4, 'Код должен содержать минимум 4 символа')
});
export type CreateCompanyInput = z.infer<typeof createCompanySchema>;

export const joinCompanySchema = z.object({
  code: z.string().min(4, 'Код должен содержать минимум 4 символа')
});
export type JoinCompanyInput = z.infer<typeof joinCompanySchema>;

export const registerSchema = z.object({
  name: z.string().min(2, 'Имя должно содержать минимум 2 символа'),
  pin: z.string().min(4, 'PIN должен содержать минимум 4 символа')
});
export type RegisterInput = z.infer<typeof registerSchema>;

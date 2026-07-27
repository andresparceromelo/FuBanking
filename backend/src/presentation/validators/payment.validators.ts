import { z } from 'zod';
import { ServiceType } from '../../domain/entities/ServicePayment';

export const createPaymentSchema = z.object({
  accountId: z.string().uuid(),
  serviceType: z.enum([
    ServiceType.ENERGIA,
    ServiceType.AGUA,
    ServiceType.INTERNET,
    ServiceType.CELULAR,
  ]),
  providerReference: z.string().max(200),
  amount: z.number().positive(),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;

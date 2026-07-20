import { z } from 'zod';

export const SendNotificationDto = z.object({
  userId: z.string().uuid().optional(),
  type: z.enum(['SYSTEM', 'EMAIL', 'SMS', 'PUSH', 'WHATSAPP']).default('SYSTEM'),
  title: z.string().min(1).max(255),
  message: z.string().min(1),
});

export type SendNotificationDtoType = z.infer<typeof SendNotificationDto>;

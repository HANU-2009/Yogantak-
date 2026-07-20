import { z } from 'zod';

export const CreateCampaignDto = z.object({
  name: z.string().min(1).max(255),
  type: z.enum(['EMAIL', 'SMS', 'WHATSAPP', 'PUSH']).default('EMAIL'),
  subject: z.string().optional(),
  content: z.string().min(1),
  audienceId: z.string().uuid().optional(),
  scheduledFor: z.string().datetime().optional(),
});

export const UpdateCampaignDto = CreateCampaignDto.partial().extend({
  status: z.enum(['DRAFT', 'SCHEDULED', 'SENT', 'CANCELLED']).optional(),
});

export const CreateAudienceDto = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  criteria: z.record(z.any()).optional(),
});

export const UpdateAudienceDto = CreateAudienceDto.partial();

export type CreateCampaignDtoType = z.infer<typeof CreateCampaignDto>;
export type UpdateCampaignDtoType = z.infer<typeof UpdateCampaignDto>;
export type CreateAudienceDtoType = z.infer<typeof CreateAudienceDto>;
export type UpdateAudienceDtoType = z.infer<typeof UpdateAudienceDto>;

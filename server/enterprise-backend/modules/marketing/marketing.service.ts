import { prisma } from '../../config/database';
import { NotFoundError } from '../../shared/errors/AppError';
import type { 
  CreateCampaignDtoType, 
  UpdateCampaignDtoType, 
  CreateAudienceDtoType, 
  UpdateAudienceDtoType 
} from './marketing.dto';

export class MarketingService {
  // Campaigns
  async getCampaigns() {
    return prisma.marketingCampaign.findMany();
  }

  async getCampaignById(id: string) {
    const campaign = await prisma.marketingCampaign.findUnique({ where: { id } });
    if (!campaign) throw new NotFoundError('Campaign not found');
    return campaign;
  }

  async createCampaign(dto: CreateCampaignDtoType) {
    return prisma.marketingCampaign.create({
      data: {
        name: dto.name,
        type: dto.type,
        subject: dto.subject,
        content: dto.content,
        audienceId: dto.audienceId,
        scheduledFor: dto.scheduledFor ? new Date(dto.scheduledFor) : null,
        status: dto.scheduledFor ? 'SCHEDULED' : 'DRAFT',
      },
    });
  }

  async updateCampaign(id: string, dto: UpdateCampaignDtoType) {
    const campaign = await prisma.marketingCampaign.findUnique({ where: { id } });
    if (!campaign) throw new NotFoundError('Campaign not found');
    return prisma.marketingCampaign.update({
      where: { id },
      data: {
        ...dto,
        scheduledFor: dto.scheduledFor ? new Date(dto.scheduledFor) : undefined,
      },
    });
  }

  async deleteCampaign(id: string) {
    return prisma.marketingCampaign.delete({ where: { id } });
  }

  // Audiences
  async getAudiences() {
    return prisma.marketingAudience.findMany();
  }

  async getAudienceById(id: string) {
    const audience = await prisma.marketingAudience.findUnique({ where: { id } });
    if (!audience) throw new NotFoundError('Audience not found');
    return audience;
  }

  async createAudience(dto: CreateAudienceDtoType) {
    return prisma.marketingAudience.create({
      data: {
        name: dto.name,
        description: dto.description,
        criteria: dto.criteria || {},
      },
    });
  }

  async updateAudience(id: string, dto: UpdateAudienceDtoType) {
    const audience = await prisma.marketingAudience.findUnique({ where: { id } });
    if (!audience) throw new NotFoundError('Audience not found');
    return prisma.marketingAudience.update({
      where: { id },
      data: {
        ...dto,
        criteria: dto.criteria || audience.criteria || {},
      },
    });
  }

  async deleteAudience(id: string) {
    return prisma.marketingAudience.delete({ where: { id } });
  }
}

export const marketingService = new MarketingService();

import { Request, Response, NextFunction } from 'express';
import { marketingService } from './marketing.service';
import { sendSuccess, sendCreated } from '../../shared/utils/response';

export class MarketingController {
  // Campaigns
  async getCampaigns(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await marketingService.getCampaigns();
      sendSuccess(res, data);
    } catch (error) { next(error); }
  }

  async getCampaignById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await marketingService.getCampaignById(req.params.id as string);
      sendSuccess(res, data);
    } catch (error) { next(error); }
  }

  async createCampaign(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await marketingService.createCampaign(req.body);
      sendCreated(res, data, 'Campaign created');
    } catch (error) { next(error); }
  }

  async updateCampaign(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await marketingService.updateCampaign(req.params.id as string, req.body);
      sendSuccess(res, data, 'Campaign updated');
    } catch (error) { next(error); }
  }

  async deleteCampaign(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await marketingService.deleteCampaign(req.params.id as string);
      sendSuccess(res, null, 'Campaign deleted');
    } catch (error) { next(error); }
  }

  // Audiences
  async getAudiences(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await marketingService.getAudiences();
      sendSuccess(res, data);
    } catch (error) { next(error); }
  }

  async getAudienceById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await marketingService.getAudienceById(req.params.id as string);
      sendSuccess(res, data);
    } catch (error) { next(error); }
  }

  async createAudience(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await marketingService.createAudience(req.body);
      sendCreated(res, data, 'Audience segment created');
    } catch (error) { next(error); }
  }

  async updateAudience(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await marketingService.updateAudience(req.params.id as string, req.body);
      sendSuccess(res, data, 'Audience segment updated');
    } catch (error) { next(error); }
  }

  async deleteAudience(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await marketingService.deleteAudience(req.params.id as string);
      sendSuccess(res, null, 'Audience segment deleted');
    } catch (error) { next(error); }
  }
}

export const marketingController = new MarketingController();

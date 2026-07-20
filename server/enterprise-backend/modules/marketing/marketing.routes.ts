import { Router } from 'express';
import { marketingController } from './marketing.controller';
import { authenticate } from '../../shared/middleware/rbac.middleware';
import { validateBody } from '../../shared/middleware/validate.middleware';
import { 
  CreateCampaignDto, 
  UpdateCampaignDto, 
  CreateAudienceDto, 
  UpdateAudienceDto 
} from './marketing.dto';

const router = Router();

router.use(authenticate);

// Campaigns
router.get('/campaigns', marketingController.getCampaigns.bind(marketingController));
router.get('/campaigns/:id', marketingController.getCampaignById.bind(marketingController));
router.post('/campaigns', validateBody(CreateCampaignDto), marketingController.createCampaign.bind(marketingController));
router.put('/campaigns/:id', validateBody(UpdateCampaignDto), marketingController.updateCampaign.bind(marketingController));
router.delete('/campaigns/:id', marketingController.deleteCampaign.bind(marketingController));

// Audiences
router.get('/audiences', marketingController.getAudiences.bind(marketingController));
router.get('/audiences/:id', marketingController.getAudienceById.bind(marketingController));
router.post('/audiences', validateBody(CreateAudienceDto), marketingController.createAudience.bind(marketingController));
router.put('/audiences/:id', validateBody(UpdateAudienceDto), marketingController.updateAudience.bind(marketingController));
router.delete('/audiences/:id', marketingController.deleteAudience.bind(marketingController));

export default router;

import { Router } from 'express';
import { analyticsController } from './analytics.controller';
import { authenticate, requirePermission, Permissions } from '../../shared/middleware/rbac.middleware';
import { validateQuery } from '../../shared/middleware/validate.middleware';
import { 
  GetRecommendationDto, 
  GetForecastDto, 
  GetVelocityDto, 
  GetAbcXyzDto 
} from './analytics.dto';

const router = Router();

router.use(authenticate);

// ============================================================
// AI PRODUCT RECOMMENDATIONS
// ============================================================

/**
 * @swagger
 * /analytics/recommendations:
 *   get:
 *     tags: [Analytics]
 *     summary: Retrieve collaborative AI recommendations for products
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: productId
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 5 }
 *     responses:
 *       200:
 *         description: List of recommended products
 */
router.get('/recommendations', requirePermission(Permissions.ANALYTICS_READ), validateQuery(GetRecommendationDto), analyticsController.getRecommendations.bind(analyticsController));

// ============================================================
// AI INVENTORY FORECASTING / DEMAND PREDICTION
// ============================================================

/**
 * @swagger
 * /analytics/forecast:
 *   get:
 *     tags: [Analytics]
 *     summary: Predict product sales demand trend for the next N days
 *     parameters:
 *       - in: query
 *         name: productId
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: daysToForecast
 *         schema: { type: integer, default: 30 }
 *     responses:
 *       200:
 *         description: Sales forecast trend predictions
 */
router.get('/forecast', requirePermission(Permissions.ANALYTICS_COMPUTE), validateQuery(GetForecastDto), analyticsController.predictDemand.bind(analyticsController));

// ============================================================
// SMART REORDER SUGGESTIONS
// ============================================================

/**
 * @swagger
 * /analytics/reorder-suggestions:
 *   get:
 *     tags: [Analytics]
 *     summary: Retrieve reorder suggestions for low stock items
 *     responses:
 *       200:
 *         description: List of reorder suggestions
 */
router.get('/reorder-suggestions', requirePermission(Permissions.ANALYTICS_READ), analyticsController.getReorderSuggestions.bind(analyticsController));

// ============================================================
// DEAD STOCK DETECTION
// ============================================================

/**
 * @swagger
 * /analytics/dead-stock:
 *   get:
 *     tags: [Analytics]
 *     summary: Detect items with zero sales in the past 90 days
 *     responses:
 *       200:
 *         description: Dead stock items and capital locked value
 */
router.get('/dead-stock', requirePermission(Permissions.ANALYTICS_READ), analyticsController.getDeadStock.bind(analyticsController));

// ============================================================
// FAST / SLOW MOVING VELOCITY CLASSIFICATION
// ============================================================

/**
 * @swagger
 * /analytics/velocity:
 *   get:
 *     tags: [Analytics]
 *     summary: Classify products as FAST, MEDIUM, or SLOW moving
 *     parameters:
 *       - in: query
 *         name: days
 *         schema: { type: integer, default: 30 }
 *     responses:
 *       200:
 *         description: Products moving velocity classifications
 */
router.get('/velocity', requirePermission(Permissions.ANALYTICS_READ), validateQuery(GetVelocityDto), analyticsController.getVelocityClassification.bind(analyticsController));

// ============================================================
// ABC & XYZ CLASSIFICATION MATRIX
// ============================================================

/**
 * @swagger
 * /analytics/abc-xyz:
 *   get:
 *     tags: [Analytics]
 *     summary: Generate ABC (value) and XYZ (predictability) categorization matrix
 *     parameters:
 *       - in: query
 *         name: days
 *         schema: { type: integer, default: 90 }
 *     responses:
 *       200:
 *         description: ABC-XYZ classified matrix of products
 */
router.get('/abc-xyz', requirePermission(Permissions.ANALYTICS_READ), validateQuery(GetAbcXyzDto), analyticsController.getAbcXyzAnalysis.bind(analyticsController));

// ============================================================
// TURNOVER & SELL THROUGH RATE
// ============================================================

/**
 * @swagger
 * /analytics/turnover-str:
 *   get:
 *     tags: [Analytics]
 *     summary: Retrieve Sell-Through Rates (STR) and inventory turnover calculations
 *     responses:
 *       200:
 *         description: STR and turnover rate list
 */
router.get('/turnover-str', requirePermission(Permissions.ANALYTICS_READ), analyticsController.getTurnoverAndStr.bind(analyticsController));

// ============================================================
// BI DASHBOARD METRICS
// ============================================================

/**
 * @swagger
 * /analytics/dashboard:
 *   get:
 *     tags: [Analytics]
 *     summary: Get dashboard KPIs and aggregates for Business Intelligence
 *     responses:
 *       200:
 *         description: Business Intelligence Dashboard aggregates
 */
router.get('/dashboard', requirePermission(Permissions.DASHBOARD_VIEW), analyticsController.getAnalyticsDashboard.bind(analyticsController));

export default router;

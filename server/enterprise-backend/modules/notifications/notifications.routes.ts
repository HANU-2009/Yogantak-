import { Router } from 'express';
import { notificationsController } from './notifications.controller';
import { authenticate, requirePermission, Permissions } from '../../shared/middleware/rbac.middleware';
import { validateBody } from '../../shared/middleware/validate.middleware';
import { SendNotificationDto } from './notifications.dto';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /notifications/my-notifications:
 *   get:
 *     tags: [Alerts]
 *     summary: Fetch logged-in user's notification inbox
 *     responses:
 *       200:
 *         description: Notifications inbox retrieved
 */
router.get('/my-notifications', notificationsController.getMyNotifications.bind(notificationsController));

/**
 * @swagger
 * /notifications/mark-read/{id}:
 *   post:
 *     tags: [Alerts]
 *     summary: Mark a notification as read
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Notification marked as read
 *       404:
 *         description: Notification not found
 */
router.post('/mark-read/:id', notificationsController.markAsRead.bind(notificationsController));

/**
 * @swagger
 * /notifications/{id}/read:
 *   put:
 *     tags: [Alerts]
 *     summary: Mark a notification as read (alias)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Notification marked as read
 *       404:
 *         description: Notification not found
 */
router.put('/:id/read', notificationsController.markAsRead.bind(notificationsController));

/**
 * @swagger
 * /notifications/mark-all-read:
 *   post:
 *     tags: [Alerts]
 *     summary: Mark all user notifications as read
 *     responses:
 *       200:
 *         description: All notifications marked as read
 */
router.post('/mark-all-read', notificationsController.markAllAsRead.bind(notificationsController));

/**
 * @swagger
 * /notifications/read-all:
 *   post:
 *     tags: [Alerts]
 *     summary: Mark all user notifications as read (alias)
 *     responses:
 *       200:
 *         description: All notifications marked as read
 */
router.post('/read-all', notificationsController.markAllAsRead.bind(notificationsController));

/**
 * @swagger
 * /notifications/send:
 *   post:
 *     tags: [Alerts]
 *     summary: Dispatch custom notification/alert (admin only)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, message]
 *             properties:
 *               userId: { type: string }
 *               type: { type: string }
 *               title: { type: string }
 *               message: { type: string }
 *     responses:
 *       201:
 *         description: Notification dispatched successfully
 */
router.post('/send', requirePermission(Permissions.USERS_UPDATE), validateBody(SendNotificationDto), notificationsController.sendNotification.bind(notificationsController));

export default router;

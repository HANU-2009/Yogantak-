import { Router } from 'express';
import { cmsController } from './cms.controller';
import { authenticate } from '../../shared/middleware/rbac.middleware';
import { validateBody } from '../../shared/middleware/validate.middleware';
import { 
  CreatePageDto, 
  UpdatePageDto, 
  CreateBlogDto, 
  UpdateBlogDto,
  CreateBannerDto,
  UpdateBannerDto,
  CreateTestimonialDto,
  UpdateTestimonialDto,
  CreateFaqDto,
  UpdateFaqDto
} from './cms.dto';

const router = Router();

// Public routes (typically for frontend)

/**
 * @swagger
 * /cms/pages:
 *   get:
 *     tags: [CMS]
 *     summary: Retrieve all CMS pages
 *     responses:
 *       200:
 *         description: Pages retrieved successfully
 */
router.get('/pages', cmsController.getPages.bind(cmsController));

/**
 * @swagger
 * /cms/pages/{slug}:
 *   get:
 *     tags: [CMS]
 *     summary: Retrieve a CMS page by slug
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Page retrieved successfully
 *       404:
 *         description: Page not found
 */
router.get('/pages/:slug', cmsController.getPageBySlug.bind(cmsController));

/**
 * @swagger
 * /cms/blogs:
 *   get:
 *     tags: [CMS]
 *     summary: Retrieve all blog posts
 *     responses:
 *       200:
 *         description: Blogs retrieved successfully
 */
router.get('/blogs', cmsController.getBlogs.bind(cmsController));

/**
 * @swagger
 * /cms/blogs/{slug}:
 *   get:
 *     tags: [CMS]
 *     summary: Retrieve a blog post by slug
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Blog retrieved successfully
 *       404:
 *         description: Blog not found
 */
router.get('/blogs/:slug', cmsController.getBlogBySlug.bind(cmsController));

/**
 * @swagger
 * /cms/banners:
 *   get:
 *     tags: [CMS]
 *     summary: Retrieve banners/sliders
 *     responses:
 *       200:
 *         description: Banners retrieved successfully
 */
router.get('/banners', cmsController.getBanners.bind(cmsController));

/**
 * @swagger
 * /cms/testimonials:
 *   get:
 *     tags: [CMS]
 *     summary: Retrieve testimonials
 *     responses:
 *       200:
 *         description: Testimonials retrieved successfully
 */
router.get('/testimonials', cmsController.getTestimonials.bind(cmsController));

/**
 * @swagger
 * /cms/faqs:
 *   get:
 *     tags: [CMS]
 *     summary: Retrieve FAQ items
 *     responses:
 *       200:
 *         description: FAQs retrieved successfully
 */
router.get('/faqs', cmsController.getFaqs.bind(cmsController));

// Protected admin routes
router.use(authenticate);

/**
 * @swagger
 * /cms/pages:
 *   post:
 *     tags: [CMS]
 *     summary: Create a CMS page
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, slug, content]
 *             properties:
 *               title: { type: string }
 *               slug: { type: string }
 *               content: { type: string }
 *               isPublished: { type: boolean }
 *     responses:
 *       201:
 *         description: Page created successfully
 */
router.post('/pages', validateBody(CreatePageDto), cmsController.createPage.bind(cmsController));

/**
 * @swagger
 * /cms/pages/{id}:
 *   put:
 *     tags: [CMS]
 *     summary: Update a CMS page
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               content: { type: string }
 *     responses:
 *       200:
 *         description: Page updated successfully
 *   delete:
 *     tags: [CMS]
 *     summary: Delete a CMS page
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Page deleted successfully
 */
router.put('/pages/:id', validateBody(UpdatePageDto), cmsController.updatePage.bind(cmsController));
router.delete('/pages/:id', cmsController.deletePage.bind(cmsController));

/**
 * @swagger
 * /cms/blogs:
 *   post:
 *     tags: [CMS]
 *     summary: Create a blog post
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, slug, content]
 *             properties:
 *               title: { type: string }
 *               slug: { type: string }
 *               content: { type: string }
 *     responses:
 *       201:
 *         description: Blog created successfully
 */
router.post('/blogs', validateBody(CreateBlogDto), cmsController.createBlog.bind(cmsController));

/**
 * @swagger
 * /cms/blogs/{id}:
 *   put:
 *     tags: [CMS]
 *     summary: Update a blog post
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               content: { type: string }
 *     responses:
 *       200:
 *         description: Blog updated successfully
 *   delete:
 *     tags: [CMS]
 *     summary: Delete a blog post
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Blog deleted successfully
 */
router.put('/blogs/:id', validateBody(UpdateBlogDto), cmsController.updateBlog.bind(cmsController));
router.delete('/blogs/:id', cmsController.deleteBlog.bind(cmsController));

/**
 * @swagger
 * /cms/banners:
 *   post:
 *     tags: [CMS]
 *     summary: Create a banner
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, imageUrl]
 *             properties:
 *               title: { type: string }
 *               imageUrl: { type: string }
 *     responses:
 *       201:
 *         description: Banner created successfully
 */
router.post('/banners', validateBody(CreateBannerDto), cmsController.createBanner.bind(cmsController));

/**
 * @swagger
 * /cms/banners/{id}:
 *   put:
 *     tags: [CMS]
 *     summary: Update a banner
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               imageUrl: { type: string }
 *     responses:
 *       200:
 *         description: Banner updated successfully
 *   delete:
 *     tags: [CMS]
 *     summary: Delete a banner
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Banner deleted successfully
 */
router.put('/banners/:id', validateBody(UpdateBannerDto), cmsController.updateBanner.bind(cmsController));
router.delete('/banners/:id', cmsController.deleteBanner.bind(cmsController));

/**
 * @swagger
 * /cms/testimonials:
 *   post:
 *     tags: [CMS]
 *     summary: Create a testimonial
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [customerName, content]
 *             properties:
 *               customerName: { type: string }
 *               content: { type: string }
 *     responses:
 *       201:
 *         description: Testimonial created successfully
 */
router.post('/testimonials', validateBody(CreateTestimonialDto), cmsController.createTestimonial.bind(cmsController));

/**
 * @swagger
 * /cms/testimonials/{id}:
 *   put:
 *     tags: [CMS]
 *     summary: Update a testimonial
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               customerName: { type: string }
 *               content: { type: string }
 *     responses:
 *       200:
 *         description: Testimonial updated successfully
 *   delete:
 *     tags: [CMS]
 *     summary: Delete a testimonial
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Testimonial deleted successfully
 */
router.put('/testimonials/:id', validateBody(UpdateTestimonialDto), cmsController.updateTestimonial.bind(cmsController));
router.delete('/testimonials/:id', cmsController.deleteTestimonial.bind(cmsController));

/**
 * @swagger
 * /cms/faqs:
 *   post:
 *     tags: [CMS]
 *     summary: Create an FAQ item
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [question, answer]
 *             properties:
 *               question: { type: string }
 *               answer: { type: string }
 *     responses:
 *       201:
 *         description: FAQ created successfully
 */
router.post('/faqs', validateBody(CreateFaqDto), cmsController.createFaq.bind(cmsController));

/**
 * @swagger
 * /cms/faqs/{id}:
 *   put:
 *     tags: [CMS]
 *     summary: Update an FAQ item
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               question: { type: string }
 *               answer: { type: string }
 *     responses:
 *       200:
 *         description: FAQ updated successfully
 *   delete:
 *     tags: [CMS]
 *     summary: Delete an FAQ item
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: FAQ deleted successfully
 */
router.put('/faqs/:id', validateBody(UpdateFaqDto), cmsController.updateFaq.bind(cmsController));
router.delete('/faqs/:id', cmsController.deleteFaq.bind(cmsController));

export default router;

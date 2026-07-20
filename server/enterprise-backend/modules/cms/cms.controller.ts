import { Request, Response, NextFunction } from 'express';
import { cmsService } from './cms.service';
import { sendSuccess, sendCreated } from '../../shared/utils/response';

export class CmsController {
  // Pages
  async getPages(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await cmsService.getPages();
      sendSuccess(res, data);
    } catch (error) { next(error); }
  }

  async getPageBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await cmsService.getPageBySlug(req.params.slug as string);
      sendSuccess(res, data);
    } catch (error) { next(error); }
  }

  async createPage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await cmsService.createPage(req.body, req.user?.id);
      sendCreated(res, data, 'Page created');
    } catch (error) { next(error); }
  }

  async updatePage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await cmsService.updatePage(req.params.id as string, req.body);
      sendSuccess(res, data, 'Page updated');
    } catch (error) { next(error); }
  }

  async deletePage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await cmsService.deletePage(req.params.id as string);
      sendSuccess(res, null, 'Page deleted');
    } catch (error) { next(error); }
  }

  // Blogs
  async getBlogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await cmsService.getBlogs();
      sendSuccess(res, data);
    } catch (error) { next(error); }
  }

  async getBlogBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await cmsService.getBlogBySlug(req.params.slug as string);
      sendSuccess(res, data);
    } catch (error) { next(error); }
  }

  async createBlog(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await cmsService.createBlog(req.body, req.user?.id);
      sendCreated(res, data, 'Blog created');
    } catch (error) { next(error); }
  }

  async updateBlog(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await cmsService.updateBlog(req.params.id as string, req.body);
      sendSuccess(res, data, 'Blog updated');
    } catch (error) { next(error); }
  }

  async deleteBlog(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await cmsService.deleteBlog(req.params.id as string);
      sendSuccess(res, null, 'Blog deleted');
    } catch (error) { next(error); }
  }

  // Banners
  async getBanners(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await cmsService.getBanners();
      sendSuccess(res, data);
    } catch (error) { next(error); }
  }

  async createBanner(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await cmsService.createBanner(req.body);
      sendCreated(res, data, 'Banner created');
    } catch (error) { next(error); }
  }

  async updateBanner(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await cmsService.updateBanner(req.params.id as string, req.body);
      sendSuccess(res, data, 'Banner updated');
    } catch (error) { next(error); }
  }

  async deleteBanner(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await cmsService.deleteBanner(req.params.id as string);
      sendSuccess(res, null, 'Banner deleted');
    } catch (error) { next(error); }
  }

  // Testimonials
  async getTestimonials(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await cmsService.getTestimonials();
      sendSuccess(res, data);
    } catch (error) { next(error); }
  }

  async createTestimonial(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await cmsService.createTestimonial(req.body);
      sendCreated(res, data, 'Testimonial created');
    } catch (error) { next(error); }
  }

  async updateTestimonial(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await cmsService.updateTestimonial(req.params.id as string, req.body);
      sendSuccess(res, data, 'Testimonial updated');
    } catch (error) { next(error); }
  }

  async deleteTestimonial(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await cmsService.deleteTestimonial(req.params.id as string);
      sendSuccess(res, null, 'Testimonial deleted');
    } catch (error) { next(error); }
  }

  // FAQs
  async getFaqs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await cmsService.getFaqs();
      sendSuccess(res, data);
    } catch (error) { next(error); }
  }

  async createFaq(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await cmsService.createFaq(req.body);
      sendCreated(res, data, 'FAQ created');
    } catch (error) { next(error); }
  }

  async updateFaq(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await cmsService.updateFaq(req.params.id as string, req.body);
      sendSuccess(res, data, 'FAQ updated');
    } catch (error) { next(error); }
  }

  async deleteFaq(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await cmsService.deleteFaq(req.params.id as string);
      sendSuccess(res, null, 'FAQ deleted');
    } catch (error) { next(error); }
  }
}

export const cmsController = new CmsController();

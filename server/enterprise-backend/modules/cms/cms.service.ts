import { prisma } from '../../config/database';
import { NotFoundError } from '../../shared/errors/AppError';
import type { 
  CreatePageDtoType, 
  UpdatePageDtoType, 
  CreateBlogDtoType, 
  UpdateBlogDtoType,
  CreateBannerDtoType,
  UpdateBannerDtoType,
  CreateTestimonialDtoType,
  UpdateTestimonialDtoType,
  CreateFaqDtoType,
  UpdateFaqDtoType
} from './cms.dto';

export class CmsService {
  // Pages
  async getPages() {
    return prisma.cmsPage.findMany();
  }

  async getPageBySlug(slug: string) {
    const page = await prisma.cmsPage.findUnique({ where: { slug } });
    if (!page) throw new NotFoundError('Page not found');
    return page;
  }

  async createPage(dto: CreatePageDtoType, authorId?: string) {
    return prisma.cmsPage.create({
      data: {
        ...dto,
        authorId,
      },
    });
  }

  async updatePage(id: string, dto: UpdatePageDtoType) {
    const page = await prisma.cmsPage.findUnique({ where: { id } });
    if (!page) throw new NotFoundError('Page not found');
    return prisma.cmsPage.update({ where: { id }, data: dto });
  }

  async deletePage(id: string) {
    return prisma.cmsPage.delete({ where: { id } });
  }

  // Blogs
  async getBlogs() {
    return prisma.cmsBlog.findMany();
  }

  async getBlogBySlug(slug: string) {
    const blog = await prisma.cmsBlog.findUnique({ where: { slug } });
    if (!blog) throw new NotFoundError('Blog not found');
    return blog;
  }

  async createBlog(dto: CreateBlogDtoType, authorId?: string) {
    return prisma.cmsBlog.create({
      data: {
        ...dto,
        tags: dto.tags || [],
        authorId,
      },
    });
  }

  async updateBlog(id: string, dto: UpdateBlogDtoType) {
    const blog = await prisma.cmsBlog.findUnique({ where: { id } });
    if (!blog) throw new NotFoundError('Blog not found');
    return prisma.cmsBlog.update({ 
      where: { id }, 
      data: {
        ...dto,
        tags: dto.tags || blog.tags,
      } 
    });
  }

  async deleteBlog(id: string) {
    return prisma.cmsBlog.delete({ where: { id } });
  }

  // Banners
  async getBanners() {
    return prisma.cmsBanner.findMany({ orderBy: { sortOrder: 'asc' } });
  }

  async createBanner(dto: CreateBannerDtoType) {
    return prisma.cmsBanner.create({ data: dto });
  }

  async updateBanner(id: string, dto: UpdateBannerDtoType) {
    const banner = await prisma.cmsBanner.findUnique({ where: { id } });
    if (!banner) throw new NotFoundError('Banner not found');
    return prisma.cmsBanner.update({ where: { id }, data: dto });
  }

  async deleteBanner(id: string) {
    return prisma.cmsBanner.delete({ where: { id } });
  }

  // Testimonials
  async getTestimonials() {
    return prisma.cmsTestimonial.findMany({ where: { isActive: true } });
  }

  async createTestimonial(dto: CreateTestimonialDtoType) {
    return prisma.cmsTestimonial.create({ data: dto });
  }

  async updateTestimonial(id: string, dto: UpdateTestimonialDtoType) {
    const testimonial = await prisma.cmsTestimonial.findUnique({ where: { id } });
    if (!testimonial) throw new NotFoundError('Testimonial not found');
    return prisma.cmsTestimonial.update({ where: { id }, data: dto });
  }

  async deleteTestimonial(id: string) {
    return prisma.cmsTestimonial.delete({ where: { id } });
  }

  // FAQs
  async getFaqs() {
    return prisma.cmsFaq.findMany({ orderBy: { sortOrder: 'asc' } });
  }

  async createFaq(dto: CreateFaqDtoType) {
    return prisma.cmsFaq.create({ data: dto });
  }

  async updateFaq(id: string, dto: UpdateFaqDtoType) {
    const faq = await prisma.cmsFaq.findUnique({ where: { id } });
    if (!faq) throw new NotFoundError('FAQ not found');
    return prisma.cmsFaq.update({ where: { id }, data: dto });
  }

  async deleteFaq(id: string) {
    return prisma.cmsFaq.delete({ where: { id } });
  }
}

export const cmsService = new CmsService();

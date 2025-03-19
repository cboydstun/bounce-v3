import mongoose, { Document, Model, Types } from "mongoose";

// Keep existing interfaces
export interface Blog {
  _id: string;
  title: string;
  slug: string;
  author: {
    _id: string;
    name?: string;
  };
  introduction: string;
  body: string;
  conclusion: string;
  images: Array<{
    filename: string;
    url: string;
    public_id: string;
    mimetype?: string;
    size?: number;
  }>;
  excerpt?: string;
  featuredImage?: string;
  categories: string[];
  tags: string[];
  status: "draft" | "published" | "archived";
  publishDate?: string;
  lastModified?: string;
  meta: {
    views: number;
    likes: number;
    shares: number;
  };
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    focusKeyword?: string;
  };
  readTime?: number;
  isFeature?: boolean;
  relatedPosts?: Array<{
    _id: string;
    title: string;
    slug: string;
  }>;
}

// Add Mongoose interfaces
export interface IBlog {
  title: string;
  slug: string;
  author:
    | Types.ObjectId
    | {
        _id: Types.ObjectId;
        name?: string;
      };
  introduction: string;
  body: string;
  conclusion: string;
  images: Array<{
    filename: string;
    url: string;
    public_id: string;
    mimetype?: string;
    size?: number;
  }>;
  excerpt?: string;
  featuredImage?: string;
  categories: string[];
  tags: string[];
  status: "draft" | "published" | "archived";
  publishDate?: string;
  lastModified?: string;
  meta: {
    views: number;
    likes: number;
    shares: number;
  };
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    focusKeyword?: string;
  };
  readTime?: number;
  isFeature?: boolean;
  relatedPosts?:
    | Types.ObjectId[]
    | Array<{
        _id: Types.ObjectId;
        title: string;
        slug: string;
      }>;
}

export interface IBlogDocument extends IBlog, Document {
  generateSlug(): Promise<string>;
  calculateReadTime(): number;
}

export interface IBlogModel extends Model<IBlogDocument> {
  findBySlug(slug: string): mongoose.Query<IBlogDocument | null, IBlogDocument>;
  findByCategory(
    category: string,
  ): mongoose.Query<IBlogDocument[], IBlogDocument>;
  findByTag(tag: string): mongoose.Query<IBlogDocument[], IBlogDocument>;
  findPublished(): mongoose.Query<IBlogDocument[], IBlogDocument>;
  searchBlogs(query: string): mongoose.Query<IBlogDocument[], IBlogDocument>;
}

// Form data interface for creating/updating blogs
export interface BlogFormData {
  title: string;
  introduction: string;
  body: string;
  conclusion: string;
  excerpt?: string;
  featuredImage?: string;
  categories: string[];
  tags: string[];
  status: "draft" | "published" | "archived";
  publishDate?: string;
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    focusKeyword?: string;
  };
  isFeature?: boolean;
  relatedPosts?: string[];
}

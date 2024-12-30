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
    status: 'draft' | 'published' | 'archived';
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
  }
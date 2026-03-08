export interface BlogPost {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  excerpt: string;
  publishedAt: string;
  updatedAt: string;
  category: string;
  tags: string[];
  content: string;
  relatedCategories: string[];
}

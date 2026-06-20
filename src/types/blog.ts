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
  /** Optional post-specific FAQ. Overrides the generic blog FAQ when present. */
  faq?: { q: string; a: string }[];
  /** Optional internal links to specific products shown in a dedicated section. */
  productLinks?: { slug: string; label: string }[];
}

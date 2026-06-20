/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  to?: string
  displayName?: string
  previewData?: Record<string, any>
}

import { template as orderConfirmation } from './order-confirmation.tsx'
import { template as newOrderAdmin } from './new-order-admin.tsx'
import { template as monthlyNewsletter } from './monthly-newsletter.tsx'
import { template as abandonedCart1h } from './abandoned-cart-1h.tsx'
import { template as abandonedCart24h } from './abandoned-cart-24h.tsx'
import { template as abandonedCart72h } from './abandoned-cart-72h.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'order-confirmation': orderConfirmation,
  'new-order-admin': newOrderAdmin,
  'monthly-newsletter': monthlyNewsletter,
  'abandoned-cart-1h': abandonedCart1h,
  'abandoned-cart-24h': abandonedCart24h,
  'abandoned-cart-72h': abandonedCart72h,
}

import { type Request, type Response } from '@vercel/edge';

export const config = {
    matcher: ['/((?!.*\\..*|_next).*)', '/'],
};

export default function middleware(request: Request): Response | undefined {
    // Pass through - Prerender.io service is deprecated
  return undefined;
}

import { useState, useRef, useEffect, memo, ImgHTMLAttributes } from "react";

interface OptimizedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'onLoad' | 'onError'> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  sizes?: string;
  className?: string;
  placeholderClass?: string;
}

/**
 * Performance-optimized image component:
 * - Intersection Observer lazy loading (native + fallback)
 * - Fade-in on load to eliminate perceived CLS
 * - Priority loading for above-the-fold (LCP) images
 * - Printify CDN resize params for responsive images
 */
function buildSrcSet(src: string): string | undefined {
  // Only optimize Printify CDN images
  if (!src.includes("images-api.printify.com")) return undefined;
  const base = src.replace(/[?&]s=\d+/g, "").replace(/[?&]width=\d+/g, "");
  const sep = base.includes("?") ? "&" : "?";
  return [200, 400, 600, 800].map(w => `${base}${sep}width=${w} ${w}w`).join(", ");
}

function OptimizedImageInner({
  src,
  alt,
  width,
  height,
  priority = false,
  sizes,
  className = "",
  placeholderClass = "",
  ...rest
}: OptimizedImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [inView, setInView] = useState(priority);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (priority || inView) return;
    const el = imgRef.current;
    if (!el) return;

    if (!("IntersectionObserver" in window)) {
      setInView(true);
      return;
    }

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { rootMargin: "200px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [priority, inView]);

  const srcSet = buildSrcSet(src);
  const defaultSizes = sizes || "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw";

  return (
    <img
      ref={imgRef}
      src={inView ? src : undefined}
      srcSet={inView ? srcSet : undefined}
      sizes={srcSet ? defaultSizes : undefined}
      alt={alt}
      width={width}
      height={height}
      loading={priority ? "eager" : "lazy"}
      decoding={priority ? "sync" : "async"}
      fetchPriority={priority ? "high" : undefined}
      onLoad={() => setLoaded(true)}
      className={`${className} transition-opacity duration-300 ${loaded || !inView ? "opacity-100" : "opacity-0"}`}
      {...rest}
    />
  );
}

export const OptimizedImage = memo(OptimizedImageInner);

import { useSearchParams } from "react-router-dom";
import { ProductCard } from "@/components/ProductCard";
import { useProducts } from "@/hooks/use-products";
import { SEOHead } from "@/components/SEOHead";
import { SEOHomeContent, SEOGiftContent } from "@/components/SEOKeywordContent";
import { usePrerenderReady } from "@/hooks/use-prerender-ready";

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q")?.toLowerCase() || "";
  const { data: allProducts = [] } = useProducts();
  usePrerenderReady();

  const results = query
    ? allProducts.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          p.category.toLowerCase().includes(query)
      )
    : [];

  return (
    <div className="min-h-screen">
      <SEOHead
        title={`Haku: ${searchParams.get("q") || ""} – Huumorikauppa`}
        description={`Hakutulokset haulle "${searchParams.get("q") || ""}". Löydä hauskoja t-paitoja, huppareita, mukeja ja tarroja.`}
        noindex={true}
      />
      <div className="container py-10 md:py-14">
        <h1 className="font-display text-2xl md:text-3xl text-foreground mb-2">
          Hakutulokset: "{searchParams.get("q")}"
        </h1>
        <p className="text-muted-foreground mb-8">
          {results.length > 0
            ? `${results.length} tuotetta löytyi`
            : "Ei hakutuloksia. Kokeile toista hakusanaa!"}
        </p>
        {results.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {results.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
      <SEOHomeContent />
      <SEOGiftContent />
    </div>
  );
};

export default SearchPage;

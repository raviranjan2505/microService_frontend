"use client";

import { useCallback, useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getProductsBySearchPage } from "@/lib/actions/action";
import type { Product } from "@/lib/data";
import SkeletonLoader from "@/components/Loaders/SkeletonLoader";
import ProductCard from "@/components/Home/ProductCard";
import { API_BASE_URL } from "@/utils/api";
import { UIProductCard } from "@/components/Home/ProductCard";
import { useInfiniteWindowScroll } from "@/hooks/useInfiniteWindowScroll";

const PAGE_SIZE = 20;

function mapProductsToCards(items: Product[]): UIProductCard[] {
  return items.map((product) => {
    const image =
      product.images?.[0]?.url && product.images[0].url.startsWith("http")
        ? product.images[0].url
        : product.images?.[0]?.url
          ? `${API_BASE_URL}${product.images[0].url}`
          : "/no-image.png";

    return {
      id: String(product.id),
      categoryId: String(product.categoryId),
      title: product.productName || "Unnamed Product",
      subtitle: product.shortDescription?.slice(0, 40) || "",
      price: product.dp ?? 0,
      slag: product.productSlug || product.productCode || "",
      img: image,
      deliveryTime: "16 MINS",
    };
  });
}

function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get("query") || "";

  const [products, setProducts] = useState<UIProductCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadPage = useCallback(async (targetPage: number, append = false) => {
    if (!query) {
      setProducts([]);
      setPage(1);
      setTotalPages(1);
      setLoading(false);
      return;
    }

    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const data = await getProductsBySearchPage(query, targetPage, PAGE_SIZE);
      const mappedProducts = mapProductsToCards(data?.items ?? []);

      setProducts((previous) => (append ? [...previous, ...mappedProducts] : mappedProducts));
      setPage(data?.pageNumber ?? targetPage);
      setTotalPages(data?.totalPages ?? 1);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [query]);

  useEffect(() => {
    setProducts([]);
    setPage(1);
    setTotalPages(1);
    void loadPage(1);
  }, [loadPage, query]);

  useInfiniteWindowScroll({
    enabled: !loading && !loadingMore && page < totalPages,
    onLoadMore: () => {
      void loadPage(page + 1, true);
    },
  });

  if (loading) {
    return (
      <div className="flex">
        <aside className="sticky top-0 h-screen w-52 overflow-y-auto border-r bg-white">
          <SkeletonLoader type="category" count={5} />
        </aside>
        <main className="flex-1 bg-gray-50 p-4">
          <SkeletonLoader type="product" count={8} />
        </main>
      </div>
    );
  }

  return (
    <main className="flex-1 bg-gray-50 p-4">
      <h1 className="mb-4 text-xl font-semibold">Search Results for &quot;{query}&quot;</h1>

      {products.length === 0 ? (
        <p className="text-gray-500">No products found for &quot;{query}&quot;</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
            {products.map((product, index) => (
              <ProductCard key={`${product.id}-${index}`} product={product} />
            ))}
          </div>
          {loadingMore ? <p className="py-6 text-center text-sm text-gray-500">Loading more products...</p> : null}
        </>
      )}
    </main>
  );
}

export default function ProductSearchPage() {
  return (
    <Suspense fallback={<SkeletonLoader type="product" count={8} />}>
      <SearchResults />
    </Suspense>
  );
}

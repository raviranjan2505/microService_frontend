"use client";

import { useCallback, useEffect, useState, use } from "react";
import ProductCard, { UIProductCard } from "@/components/Home/ProductCard";
import SkeletonLoader from "@/components/Loaders/SkeletonLoader";
import { API_BASE_URL } from "@/utils/api";
import { getProductsBySlug } from "@/lib/actions/action";
import { useInfiniteWindowScroll } from "@/hooks/useInfiniteWindowScroll";

const PAGE_SIZE = 20;

interface CategoryPageProps {
  params: Promise<{ categoriesBySlug: string }>;
}

function mapProducts(items: any[]): UIProductCard[] {
  return items.map((product): UIProductCard => {
    const imageUrl =
      product?.defaultImage ||
      product?.images?.find?.((image: any) => image?.isDefault)?.url ||
      product?.images?.[0]?.url ||
      "/image/bread.png";

    const img =
      typeof imageUrl === "string" && imageUrl.startsWith("http")
        ? imageUrl
        : imageUrl === "/image/bread.png"
          ? imageUrl
          : `${API_BASE_URL}${imageUrl}`;

    return {
      id: String(product?.id ?? ""),
      categoryId: String(product?.categoryId ?? ""),
      title: product?.productName || "",
      subtitle: product?.shortDescription || product?.productCode || "",
      price: Number(product?.dp ?? 0),
      slag: product?.productSlug || product?.productCode || "",
      img,
      deliveryTime: "16 MINS",
    };
  });
}

export default function GetProductByCategoriesSlug({ params }: CategoryPageProps) {
  const { categoriesBySlug } = use(params);
  const [products, setProducts] = useState<UIProductCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadPage = useCallback(async (targetPage: number, append = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const response = await getProductsBySlug(categoriesBySlug, targetPage, PAGE_SIZE);
      const payload = response?.data;
      const mappedProducts = mapProducts(Array.isArray(payload?.items) ? payload.items : []);

      setProducts((previous) => (append ? [...previous, ...mappedProducts] : mappedProducts));
      setPage(Number(payload?.pageNumber ?? targetPage));
      setTotalPages(Math.max(1, Number(payload?.totalPages ?? 1)));
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [categoriesBySlug]);

  useEffect(() => {
    setProducts([]);
    setPage(1);
    setTotalPages(1);
    void loadPage(1);
  }, [categoriesBySlug, loadPage]);

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
      {products.length === 0 ? (
        <p className="text-gray-500">No products found</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
            {products.map((product) => (
              <ProductCard key={`${product.id}-${product.slag}`} product={product} />
            ))}
          </div>
          {loadingMore ? <p className="py-6 text-center text-sm text-gray-500">Loading more products...</p> : null}
        </>
      )}
    </main>
  );
}

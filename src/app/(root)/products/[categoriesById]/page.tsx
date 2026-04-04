"use client";

import { useEffect, useState, use } from "react";
import {
  getCategoryById,
  getProductsBySlug,
  getProductsBySubCategoriesSlug,
} from "@/lib/actions/action";
import ProductCard, { UIProductCard } from "@/components/Home/ProductCard";
import SkeletonLoader from "@/components/Loaders/SkeletonLoader";
import { API_BASE_URL } from "@/utils/api";
import { useInfiniteWindowScroll } from "@/hooks/useInfiniteWindowScroll";

const PAGE_SIZE = 20;

interface CategoryPageProps {
  params: Promise<{ categoriesById: string }>;
}

interface CategoryNode {
  categoryId: number;
  categoryName: string;
  slug: string;
}

function mapProducts(items: any[]): UIProductCard[] {
  return items.map(
    (product: any): UIProductCard => ({
      id: String(product.id),
      categoryId: String(product.categoryId),
      title: product.productName,
      subtitle: product.shortDescription || product.productCode,
      price: Number(product.dp ?? 0),
      slag: product.productSlug || product.productCode,
      img: product.defaultImage?.startsWith("http")
        ? product.defaultImage
        : product.defaultImage
          ? `${API_BASE_URL}${product.defaultImage}`
          : "/image/bread.png",
      deliveryTime: "16 MINS",
    })
  );
}

export default function CategoryWithProducts({ params }: CategoryPageProps) {
  const { categoriesById } = use(params);

  const [subcategories, setSubcategories] = useState<CategoryNode[]>([]);
  const [products, setProducts] = useState<UIProductCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [parentSlug, setParentSlug] = useState("");
  const [activeSubcategorySlug, setActiveSubcategorySlug] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadProducts = async (
    targetPage: number,
    parentCategorySlug: string,
    subcategorySlug = "",
    append = false
  ) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const response = subcategorySlug
        ? await getProductsBySubCategoriesSlug(parentCategorySlug, subcategorySlug, targetPage, PAGE_SIZE)
        : await getProductsBySlug(parentCategorySlug, targetPage, PAGE_SIZE);

      const payload = response?.data;
      const mapped = mapProducts(Array.isArray(payload?.items) ? payload.items : []);

      setProducts((previous) => (append ? [...previous, ...mapped] : mapped));
      setPage(Number(payload?.pageNumber ?? targetPage));
      setTotalPages(Math.max(1, Number(payload?.totalPages ?? 1)));
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    const fetchCategory = async () => {
      setLoading(true);
      setProducts([]);
      setSubcategories([]);
      setParentSlug("");
      setActiveSubcategorySlug("");
      setPage(1);
      setTotalPages(1);

      try {
        const categoryResponse = await getCategoryById(Number(categoriesById));
        const category = categoryResponse?.data;
        const resolvedParentSlug = category?.slug || "";

        if (!resolvedParentSlug) {
          setProducts([]);
          return;
        }

        setParentSlug(resolvedParentSlug);
        setSubcategories(
          Array.isArray(category?.subcategories)
            ? category.subcategories.map((subcategory: any) => ({
                categoryId: subcategory.id,
                categoryName: subcategory.name,
                slug: subcategory.slug || "",
              }))
            : []
        );

        await loadProducts(1, resolvedParentSlug);
      } finally {
        setLoading(false);
      }
    };

    void fetchCategory();
  }, [categoriesById]);

  useInfiniteWindowScroll({
    enabled: !loading && !loadingMore && !!parentSlug && page < totalPages,
    onLoadMore: () => {
      void loadProducts(page + 1, parentSlug, activeSubcategorySlug, true);
    },
  });

  const handleSubcategoryClick = async (subcategorySlug = "") => {
    if (!parentSlug) return;

    setActiveSubcategorySlug(subcategorySlug);
    setProducts([]);
    setPage(1);
    setTotalPages(1);
    await loadProducts(1, parentSlug, subcategorySlug);
  };

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
    <div className="flex">
      <aside className="sticky top-0 h-screen w-32 overflow-y-auto border-r bg-white md:w-40">
        <button
          type="button"
          onClick={() => void handleSubcategoryClick("")}
          className={`w-full px-4 py-3 text-left transition ${
            activeSubcategorySlug === "" ? "bg-green-50 font-medium text-green-700" : "hover:bg-gray-100"
          }`}
        >
          All Products
        </button>
        {subcategories.map((subcategory) => (
          <button
            key={subcategory.categoryId}
            type="button"
            onClick={() => void handleSubcategoryClick(subcategory.slug)}
            className={`w-full px-4 py-3 text-left transition ${
              activeSubcategorySlug === subcategory.slug
                ? "bg-green-50 font-medium text-green-700"
                : "hover:bg-gray-100"
            }`}
          >
            {subcategory.categoryName}
          </button>
        ))}
      </aside>

      <main className="flex-1 bg-gray-50 p-4">
        {products.length === 0 ? (
          <p className="text-gray-500">No products found</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={`${product.id}-${product.slag}`} product={product} />
              ))}
            </div>
            {loadingMore ? <p className="py-6 text-center text-sm text-gray-500">Loading more products...</p> : null}
          </>
        )}
      </main>
    </div>
  );
}

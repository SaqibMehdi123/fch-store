import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminProduct, getCategoryOptions } from "@/lib/admin/queries";
import { ProductForm } from "@/components/admin/product-form";

export const metadata: Metadata = {
  title: "Edit Product",
  robots: { index: false, follow: false },
};

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, categories] = await Promise.all([getAdminProduct(id), getCategoryOptions()]);
  if (!product) notFound();

  return (
    <div className="animate-fade-in">
      <nav className="text-xs text-muted-foreground">
        <Link href="/admin/products" className="transition-colors hover:text-gold">
          Products
        </Link>
        <span aria-hidden className="mx-2">/</span>
        <span className="text-foreground">{product.name}</span>
      </nav>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-2">
        <h1 className="font-display text-3xl">{product.name}</h1>
        <Link href={`/product/${product.slug}`} target="_blank" className="text-xs text-muted-foreground transition-colors hover:text-gold">
          View on store ↗
        </Link>
      </div>
      <ProductForm
        categories={categories}
        initial={{
          id: product.id,
          categoryId: product.categoryId,
          name: product.name,
          slug: product.slug,
          description: product.description,
          fabricDetails: product.fabricDetails ?? "",
          price: String(product.price),
          salePrice: product.salePrice ? String(product.salePrice) : "",
          isFeatured: product.isFeatured,
          isActive: product.isActive,
          images: product.images.map((i) => ({ url: i.url, publicId: i.publicId ?? "" })),
          variants: product.variants.map((v) => ({
            key: v.id,
            id: v.id,
            colorName: v.colorName,
            colorHex: v.colorHex,
            size: v.size,
            sku: v.sku,
            stock: v.stock,
            lowStockThreshold: v.lowStockThreshold,
          })),
        }}
      />
    </div>
  );
}

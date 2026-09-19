import type { Metadata } from "next";
import Link from "next/link";
import { getCategoryOptions } from "@/lib/admin/queries";
import { ProductForm } from "@/components/admin/product-form";

export const metadata: Metadata = {
  title: "New Product",
  robots: { index: false, follow: false },
};

export default async function NewProductPage() {
  const categories = await getCategoryOptions();

  return (
    <div className="animate-fade-in">
      <nav className="text-xs text-muted-foreground">
        <Link href="/admin/products" className="transition-colors hover:text-gold">
          Products
        </Link>
        <span aria-hidden className="mx-2">/</span>
        <span className="text-foreground">New</span>
      </nav>
      <h1 className="mt-2 font-display text-3xl">New Product</h1>
      <ProductForm categories={categories} />
    </div>
  );
}

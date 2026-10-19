import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAdminPage } from "@/lib/admin/queries";
import { PageEditor } from "@/components/admin/page-editor";

export const metadata: Metadata = {
  title: "Edit Page",
  robots: { index: false, follow: false },
};

export default async function AdminEditPagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const page = await getAdminPage(id);
  if (!page) notFound();

  return (
    <PageEditor
      page={{ id: page.id, slug: page.slug, title: page.title, content: page.content, isActive: page.isActive }}
    />
  );
}

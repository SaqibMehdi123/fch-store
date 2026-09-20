import type { Metadata } from "next";
import { CmsPage } from "@/components/store/cms-page";
import { db } from "@/lib/db";
import { JsonLd, parseFaqMarkdown } from "@/lib/seo";

export const metadata: Metadata = {
  title: "FAQ — Fashion and Collection House",
  description:
    "How to order, how to pay, delivery times, exchanges and payment verification — answers to the most common FCH questions.",
  alternates: { canonical: "/faq" },
};

export default async function FaqPage() {
  const page = await db.page.findFirst({ where: { slug: "faq", isActive: true } });
  const faqs = page ? parseFaqMarkdown(page.content) : [];

  return (
    <>
      {faqs.length > 0 && (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.map(({ q, a }) => ({
              "@type": "Question",
              name: q,
              acceptedAnswer: { "@type": "Answer", text: a },
            })),
          }}
        />
      )}
      <CmsPage slug="faq" page={page} />
    </>
  );
}

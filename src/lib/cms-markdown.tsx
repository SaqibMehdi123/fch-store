import type { ComponentPropsWithoutRef } from "react";

/**
 * Shared markdown renderer config for CMS pages — used by the storefront
 * CmsPage component and the admin page editor preview. Client-safe: no
 * server-only imports allowed here.
 */
export const CMS_MARKDOWN_COMPONENTS = {
  h2: (props: ComponentPropsWithoutRef<"h2">) => (
    <h2 className="mt-10 border-b border-stone pb-2 font-display text-2xl first:mt-0" {...props} />
  ),
  h3: (props: ComponentPropsWithoutRef<"h3">) => <h3 className="mt-8 font-display text-xl" {...props} />,
  p: (props: ComponentPropsWithoutRef<"p">) => (
    <p className="mt-4 text-[15px] leading-7 text-foreground/85" {...props} />
  ),
  ul: (props: ComponentPropsWithoutRef<"ul">) => (
    <ul className="mt-4 list-disc space-y-1.5 pl-5 text-[15px] leading-7 text-foreground/85" {...props} />
  ),
  ol: (props: ComponentPropsWithoutRef<"ol">) => (
    <ol className="mt-4 list-decimal space-y-1.5 pl-5 text-[15px] leading-7 text-foreground/85" {...props} />
  ),
  a: (props: ComponentPropsWithoutRef<"a">) => (
    <a className="text-gold underline underline-offset-2 hover:text-foreground" {...props} />
  ),
  strong: (props: ComponentPropsWithoutRef<"strong">) => (
    <strong className="font-semibold text-foreground" {...props} />
  ),
  blockquote: (props: ComponentPropsWithoutRef<"blockquote">) => (
    <blockquote className="mt-6 border-l-2 border-gold pl-4 italic text-foreground/75" {...props} />
  ),
  hr: () => <div className="divider my-8" />,
};

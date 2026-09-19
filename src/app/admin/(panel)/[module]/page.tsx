import { notFound } from "next/navigation";
import { ALL_ADMIN_ITEMS } from "@/lib/admin-nav";

const MODULE_PHASE: Record<string, string> = {};
for (const item of ALL_ADMIN_ITEMS) {
  MODULE_PHASE[item.href] = `Phase ${item.phase}`;
}

/**
 * Module placeholder — every admin module link resolves to a real page.
 * Each is replaced by its full implementation in the phase noted on screen.
 */
export default async function AdminModulePage({ params }: { params: Promise<{ module: string }> }) {
  const { module: slug } = await params;
  const href = `/admin/${slug}`;
  const phase = MODULE_PHASE[href];
  if (!phase) notFound();

  const label = ALL_ADMIN_ITEMS.find((i) => i.href === href)?.label ?? slug;

  return (
    <div className="flex min-h-[60vh] items-center justify-center animate-fade-in">
      <div className="max-w-md text-center">
        <p className="label-caps text-gold">{phase} · Admin Module</p>
        <h1 className="mt-3 font-display text-3xl">{label}</h1>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          The {label.toLowerCase()} module is scaffolded in the navigation and will be implemented in {phase}.
        </p>
      </div>
    </div>
  );
}

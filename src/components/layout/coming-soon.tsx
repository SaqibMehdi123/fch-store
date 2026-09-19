import Link from "next/link";

/**
 * Shared placeholder for routes arriving in later phases.
 * Replaced by real implementations as each phase lands.
 */
export function ComingSoon({ title, phase, note }: { title: string; phase: string; note?: string }) {
  return (
    <section className="mx-auto flex max-w-3xl flex-col items-center px-6 py-24 text-center animate-fade-in">
      <p className="label-caps text-gold">{phase}</p>
      <h1 className="mt-3 font-display text-4xl">{title}</h1>
      <p className="mt-4 max-w-lg text-sm leading-6 text-muted-foreground">
        {note ??
          "This experience is scaffolded and will come alive in the upcoming phase of the FCH build."}
      </p>
      <Link href="/" className="mt-8 btn-outline-luxury">
        Back to Home
      </Link>
    </section>
  );
}

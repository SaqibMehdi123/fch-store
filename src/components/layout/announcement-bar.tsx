import { getSettings } from "@/lib/settings";

/**
 * Announcement bar — text and visibility are managed live from Admin → Settings.
 */
export async function AnnouncementBar() {
  const settings = await getSettings();
  if (!settings.announcementEnabled || !settings.announcementText) return null;

  return (
    <div className="bg-charcoal text-ivory text-center">
      <p className="mx-auto max-w-7xl px-4 py-2 text-[11px] uppercase tracking-[0.18em]">
        {settings.announcementText}
      </p>
    </div>
  );
}

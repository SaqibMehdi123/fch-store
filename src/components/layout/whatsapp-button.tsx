import { MessageCircle } from "lucide-react";
import { getSettings } from "@/lib/settings";

/**
 * Floating WhatsApp button — number sourced live from settings.
 * Sits above the mobile bottom nav on small screens.
 */
export async function WhatsAppButton() {
  const settings = await getSettings();
  const digits = settings.whatsappNumber.replace(/\D/g, "");
  // guard: hide until a real number is configured in Admin → Settings
  if (digits.length < 10) return null;
  const href = `https://wa.me/${digits}?text=${encodeURIComponent("Hello FCH! I have a question.")}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="fixed right-4 bottom-20 md:bottom-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-[#1FA855] text-white shadow-lg shadow-black/20 transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
    >
      <MessageCircle className="h-6 w-6" fill="currentColor" strokeWidth={0} />
      <span className="sr-only">Chat on WhatsApp</span>
    </a>
  );
}

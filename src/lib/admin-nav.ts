import {
  LayoutDashboard,
  BadgeCheck,
  Package,
  Mail,
  Shirt,
  Boxes,
  Ticket,
  Star,
  MapPin,
  Image as ImageIcon,
  FileText,
  Settings,
  Users,
  BarChart3,
} from "lucide-react";

export type AdminNavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
  phase: number;
};

/**
 * Admin module registry — single source of truth for sidebar navigation
 * and module placeholder pages. Importable from both server and client.
 */
export const ADMIN_NAV: { section: string; items: AdminNavItem[] }[] = [
  {
    section: "Overview",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard, phase: 3 },
      { href: "/admin/verification", label: "Payment Verification", icon: BadgeCheck, phase: 3 },
      { href: "/admin/orders", label: "Orders", icon: Package, phase: 3 },
      { href: "/admin/emails", label: "Email Log", icon: Mail, phase: 5 },
    ],
  },
  {
    section: "Catalog",
    items: [
      { href: "/admin/products", label: "Products", icon: Shirt, phase: 3 },
      { href: "/admin/inventory", label: "Inventory", icon: Boxes, phase: 3 },
    ],
  },
  {
    section: "Marketing",
    items: [
      { href: "/admin/coupons", label: "Coupons", icon: Ticket, phase: 4 },
      { href: "/admin/reviews", label: "Reviews", icon: Star, phase: 4 },
      { href: "/admin/banners", label: "Banners", icon: ImageIcon, phase: 4 },
    ],
  },
  {
    section: "Configuration",
    items: [
      { href: "/admin/delivery-zones", label: "Delivery Zones", icon: MapPin, phase: 4 },
      { href: "/admin/pages", label: "Pages CMS", icon: FileText, phase: 4 },
      { href: "/admin/settings", label: "Settings", icon: Settings, phase: 4 },
      { href: "/admin/team", label: "Team", icon: Users, phase: 4 },
      { href: "/admin/reports", label: "Reports", icon: BarChart3, phase: 5 },
    ],
  },
];

export const ALL_ADMIN_ITEMS = ADMIN_NAV.flatMap((s) => s.items);

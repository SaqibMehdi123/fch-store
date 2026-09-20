import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Fashion and Collection House",
    short_name: "FCH",
    description:
      "Premium Pakistani clothing delivered nationwide — kurtas, lawn suits, formals and luxury pret.",
    id: "/",
    start_url: "/",
    display: "standalone",
    background_color: "#F8F6F2",
    theme_color: "#F8F6F2",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}

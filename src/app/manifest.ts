import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Chitrashala — Art by Monika Singh & Associates",
    short_name: "Chitrashala",
    description: "A gallery of original artwork by Monika Singh and associated artists.",
    start_url: "/",
    display: "standalone",
    background_color: "#f8efdd",
    theme_color: "#6b1e2b",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}

import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Nexohub",
    short_name: "Nexohub",
    description:
      "Gerenciador mobile-first de reuniões, pessoas e designações para congregações.",
    start_url: "/login",
    display: "standalone",
    background_color: "#0c0c12",
    theme_color: "#ec7000",
    icons: [
      { src: "/icon?<generated>", sizes: "any", type: "image/png" },
      {
        src: "/apple-icon?<generated>",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}

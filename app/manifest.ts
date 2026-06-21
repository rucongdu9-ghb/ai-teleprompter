import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AI 提词助手",
    short_name: "提词助手",
    description: "专为直播带货和短视频创作者设计的 AI 提词器",
    start_url: "/",
    display: "standalone",
    background_color: "#0f0f0f",
    theme_color: "#0f0f0f",
    orientation: "any",
    icons: [
      { src: "/pwa-icon?s=192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/pwa-icon?s=512", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}

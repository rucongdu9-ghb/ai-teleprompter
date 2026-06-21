import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI 提词助手",
  description: "直播带货、短视频创作者的AI提词工具",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "提词助手",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0f0f0f",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh" className="h-full">
      <head>
        <script dangerouslySetInnerHTML={{
          __html: `if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js'))}`
        }} />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

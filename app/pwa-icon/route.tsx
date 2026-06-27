import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const s = parseInt(req.nextUrl.searchParams.get("s") ?? "192");
  const maskable = req.nextUrl.searchParams.get("m") === "1";
  const size = [192, 512].includes(s) ? s : 192;
  const play = Math.round(size * (maskable ? 0.38 : 0.5));
  const radius = maskable ? 0 : Math.round(size * 0.2);

  return new ImageResponse(
    <div
      style={{
        width: size,
        height: size,
        background: "#0f0f0f",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: radius,
      }}
    >
      <div style={{ color: "#facc15", fontSize: play, fontWeight: "bold", lineHeight: 1 }}>
        ▶
      </div>
    </div>,
    { width: size, height: size }
  );
}

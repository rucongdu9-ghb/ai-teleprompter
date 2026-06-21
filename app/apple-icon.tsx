import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: 180,
        height: 180,
        background: "#0f0f0f",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 40,
      }}
    >
      <div style={{ color: "#facc15", fontSize: 90, fontWeight: "bold", lineHeight: 1 }}>
        ▶
      </div>
    </div>,
    { width: 180, height: 180 }
  );
}

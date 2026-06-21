import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: 512,
        height: 512,
        background: "#0f0f0f",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 112,
      }}
    >
      <div style={{ color: "#facc15", fontSize: 260, fontWeight: "bold", lineHeight: 1 }}>
        ▶
      </div>
    </div>,
    { width: 512, height: 512 }
  );
}

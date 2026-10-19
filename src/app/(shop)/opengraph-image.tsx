import { ImageResponse } from "next/og";

/**
 * Branded 1200×630 OpenGraph image for every storefront route.
 * Product pages override it with their own hero image via metadata.
 */

export const alt = "Fashion and Collection House — Premium Pakistani Clothing";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#1c1013",
          color: "#FAF7F2",
        }}
      >
        {/* hairline gold frame */}
        <div
          style={{
            position: "absolute",
            top: 28,
            left: 28,
            right: 28,
            bottom: 28,
            border: "1px solid #b08155",
            display: "flex",
          }}
        />
        <div
          style={{
            display: "flex",
            fontSize: 30,
            letterSpacing: 14,
            color: "#d9c2a5",
            textTransform: "uppercase",
            marginBottom: 28,
          }}
        >
          Fashion and Collection House
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 190,
            fontWeight: 700,
            letterSpacing: 8,
            lineHeight: 1,
          }}
        >
          FCH
        </div>
        <div
          style={{
            display: "flex",
            width: 120,
            height: 2,
            backgroundColor: "#b08155",
            margin: "34px 0",
          }}
        />
        <div style={{ display: "flex", fontSize: 32, letterSpacing: 3, color: "#c9bcae" }}>
          Premium Pakistani Clothing — Nationwide Delivery
        </div>
      </div>
    ),
    size
  );
}

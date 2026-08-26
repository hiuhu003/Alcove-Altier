import { ImageResponse } from "next/og";
import { SITE } from "@/lib/site";

/**
 * The share card for every page that doesn't supply its own image (home,
 * about, contact, shop). Generated rather than shipped as a static file so it
 * always matches the brand palette and tagline in lib/site.ts.
 *
 * Product pages override this with the actual product photo.
 */
export const alt = `${SITE.name} — ${SITE.tagline}`;
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
          background: "linear-gradient(135deg, #FAF7F4 0%, #F2C4CE 100%)",
          color: "#2C2B30",
          fontFamily: "serif",
          position: "relative",
        }}
      >
        {/* Arched-A monogram, matching components/Logo.tsx */}
        <div
          style={{
            display: "flex",
            width: 132,
            height: 132,
            borderRadius: "66px 66px 8px 8px",
            border: "6px solid #2C2B30",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 44,
          }}
        >
          <div style={{ fontSize: 68, letterSpacing: -2 }}>A</div>
        </div>

        <div style={{ fontSize: 86, letterSpacing: -1, display: "flex" }}>
          {SITE.name}
        </div>

        <div
          style={{
            fontSize: 30,
            marginTop: 20,
            color: "#4F4F51",
            letterSpacing: 6,
            textTransform: "uppercase",
            display: "flex",
          }}
        >
          {SITE.tagline}
        </div>

        <div
          style={{
            fontSize: 26,
            marginTop: 40,
            color: "#4F4F51",
            display: "flex",
          }}
        >
          Handmade in Kenya · Delivered in Nairobi & countrywide
        </div>

        <div
          style={{
            position: "absolute",
            bottom: 44,
            fontSize: 22,
            color: "#F58F7C",
            letterSpacing: 3,
            display: "flex",
          }}
        >
          {SITE.url.replace(/^https?:\/\//, "")}
        </div>
      </div>
    ),
    size
  );
}

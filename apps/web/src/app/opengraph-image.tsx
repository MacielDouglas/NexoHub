import { ImageResponse } from "next/og";

export const alt = "Nexohub — Gerenciador de Reuniões";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "0 80px",
        background: "#0c0c12",
        color: "#f5f6f8",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            "radial-gradient(circle at 20% 30%, rgba(236,112,0,0.35) 0, transparent 45%), radial-gradient(circle at 80% 80%, rgba(236,112,0,0.20) 0, transparent 45%)",
        }}
      />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 24,
          marginBottom: 28,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 88,
            height: 88,
            borderRadius: 24,
            background: "#ec7000",
            color: "#ffffff",
            fontSize: 56,
            fontWeight: 800,
            letterSpacing: -4,
          }}
        >
          N
        </div>
        <div style={{ display: "flex", fontSize: 52, fontWeight: 700 }}>
          Nexohub
        </div>
      </div>
      <div
        style={{
          display: "flex",
          fontSize: 36,
          color: "#9aa1ad",
          maxWidth: 760,
          lineHeight: 1.35,
        }}
      >
        Organize reuniões, pessoas e designações da sua congregação com
        praticidade e segurança.
      </div>
    </div>,
    {
      ...size,
    },
  );
}

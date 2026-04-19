import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "SafeGate • The Maze",
  description:
    "The Maze motor-control diagnostic — navigate from start to exit without touching walls.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#020617",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="sl">
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  );
}

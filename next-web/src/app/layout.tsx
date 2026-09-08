import type { Metadata } from "next";
import "./globals.css";
import "leaflet/dist/leaflet.css";

export const metadata: Metadata = {
  title: "Jernih Brantas — Monitor & Field Mode",
  description: "Website responsif untuk simulasi pemantauan dan pencatatan kejernihan Sungai Brantas.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body>{children}</body></html>;
}

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Practitioner Network Sourcing",
  description: "Internal practitioner sourcing and review workflow"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

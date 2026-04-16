import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Winamp",
  description: "A web-based Winamp audio player clone.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="winamp-body">
        {children}
      </body>
    </html>
  );
}

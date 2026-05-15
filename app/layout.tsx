import "./globals.css";
import { ReactNode } from "react";

export const metadata = {
  title: "ImmunoTrace",
  description: "AI-powered personal health memory platform",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

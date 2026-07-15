import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Questionário Digital Trizi", template: "%s | Instituto Trizi" },
  description: "Questionário clínico digital seguro do Instituto Trizi.",
  applicationName: "Questionário Digital Trizi",
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
        <Toaster richColors position="top-right" closeButton />
      </body>
    </html>
  );
}

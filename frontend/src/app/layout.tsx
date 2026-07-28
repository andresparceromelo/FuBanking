import type { Metadata } from "next";
import { AuthProvider } from "@/shared/hooks/useAuth";
import { ToastProvider } from "@/shared/components/feedback/ToastProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Banco Digital",
  description: "Tu dinero en buenas manos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased min-h-screen flex flex-col">
        <ToastProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}

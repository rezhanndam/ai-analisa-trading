import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { Providers } from "@/components/Providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "AI Trading Intelligence",
  description: "Evidence-based trading intelligence system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <Providers>
        <div className="flex min-h-screen">
          <div className="hidden md:flex">
            <Sidebar />
          </div>
          <div className="flex-1 flex flex-col min-w-0">
            <Topbar />
            <main className="flex-1 p-4 md:p-6 overflow-auto">
              {children}
            </main>
            <nav className="md:hidden fixed bottom-0 inset-x-0 border-t bg-background flex">
              {["/dashboard", "/backtest", "/strategy", "/status"].map((href) => (
                <a key={href} href={href} className="flex-1 py-3 text-center text-xs text-muted-foreground hover:bg-accent">
                  {href.replace("/", "").replace(/^\w/, (c) => c.toUpperCase())}
                </a>
              ))}
            </nav>
          </div>
        </div>
        </Providers>
      </body>
    </html>
  );
}

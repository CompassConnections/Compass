// app/layout.tsx
import "./globals.css";
import {ThemeProvider} from 'next-themes';
import {Metadata} from "next";
import Header from "@/app/Header";
import Providers from "@/app/providers";

export const metadata: Metadata = {
  title: "BayesBond",
  description: "A bonding platform for rational thinkers",
};


export default function RootLayout(
  {
    children,
  }: {
    children: React.ReactNode;
  }) {
  return (
    <html lang="en" suppressHydrationWarning>
    <body>
    <Providers>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="min-h-screen flex flex-col dark:bg-gray-900 dark:text-white">
        <Header/>
        {children}
      </div>
      </ThemeProvider>
    </Providers>
    </body>
    </html>
  );
}

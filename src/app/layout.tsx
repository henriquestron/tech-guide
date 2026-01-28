import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer"; 
import { FavoritesProvider } from "@/context/FavoritesContext";
import OneSignalSetup from "@/components/OneSignalSetup"; // <--- 1. IMPORTE AQUI

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TechGuide Ofertas", 
  description: "As melhores ofertas tech selecionadas por IA.",
  
  verification: {
    other: {
      google:"9Sf0JqnBwDbA6vhbUP61D33Sxq0MplirE1sF6J0aNJw",
      lomadee: "2324685", 
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <OneSignalSetup /> {/* <--- 2. ADICIONE AQUI NO TOPO DO BODY */}
        
        <FavoritesProvider> 
          <div className="flex flex-col min-h-screen">
            <Navbar /> 
            <main className="flex-grow">
              {children}
            </main>
            <Footer />
          </div>
        </FavoritesProvider> 
      </body>
    </html>
  );
}
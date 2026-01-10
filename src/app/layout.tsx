import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer"; // Vamos criar esse arquivo no passo 4
import { FavoritesProvider } from "@/context/FavoritesContext"; // <--- Importe isso



const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TechGuide Ofertas", // Título do seu site
  description: "As melhores ofertas tech selecionadas por IA.",
  
  // --- ADICIONE ISSO AQUI ---
  verification: {
    other: {
      lomadee: "2324685", // Ex: "22558899"
    },
  },
  // --------------------------
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <FavoritesProvider> {/* <--- Adicione aqui abrindo */}
          <div className="flex flex-col min-h-screen">
            <Navbar /> 
            <main className="flex-grow">
              {children}
            </main>
            <Footer />
          </div>
        </FavoritesProvider> {/* <--- Feche aqui */}
      </body>
    </html>
  );
}
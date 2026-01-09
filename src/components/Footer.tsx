import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 py-8 mt-12">
      <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
        
        <div className="text-center md:text-left">
          <p className="font-bold text-zinc-900 dark:text-white">TechGuide</p>
          <p className="text-xs text-zinc-500 mt-2 max-w-md">
            As melhores recomendações de tecnologia. Participamos de programas de afiliados e podemos receber comissões por compras qualificadas.
          </p>
        </div>

        <div className="flex gap-6 text-sm text-zinc-500">
          <Link href="/termos" className="hover:text-blue-600 transition-colors">Termos de Uso</Link>
          <Link href="/privacidade" className="hover:text-blue-600 transition-colors">Privacidade</Link>
          <Link href="/sobre" className="hover:text-blue-600 transition-colors">Sobre</Link>
        </div>
      </div>
      
      <div className="text-center mt-8 text-xs text-zinc-400 border-t border-zinc-100 dark:border-zinc-900 pt-4">
         © {new Date().getFullYear()} TechGuide. Todos os direitos reservados.
      </div>
    </footer>
  );
}
import { notFound } from "next/navigation";

// --- CORREÇÃO OBRIGATÓRIA ---
// Isso força o Next.js a ler a variável de ambiente EM TEMPO REAL,
// impedindo que ele gere uma página estática "404" na hora do build.
export const dynamic = 'force-dynamic';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const isRobotServer = process.env.IS_ROBOT_SERVER === "true";
  const isLocalhost = process.env.NODE_ENV === "development";

  // --- DEBUG NO LOG DO RENDER ---
  // Se ainda der erro, vá na aba "Logs" do Render e veja o que aparece aqui.
  console.log(`🔒 ADMIN CHECK: Localhost=${isLocalhost} | RobotServer=${isRobotServer} (Valor real: ${process.env.IS_ROBOT_SERVER})`);

  if (!isRobotServer && !isLocalhost) {
    return notFound(); 
  }

  return <>{children}</>;
}
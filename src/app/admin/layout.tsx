import { notFound } from "next/navigation";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  // 1. Verifica se é o servidor do Render (que você configurou a variável)
  const isRobotServer = process.env.IS_ROBOT_SERVER === "true";

  // 2. Verifica se é o seu computador local
  // O Next.js define isso automaticamente como 'development' quando você roda "npm run dev"
  const isLocalhost = process.env.NODE_ENV === "development";

  // LÓGICA DE SEGURANÇA:
  // Se NÃO for o servidor do robô E TAMBÉM NÃO for localhost...
  // ...então bloqueia (assume que é a Vercel pública)
  if (!isRobotServer && !isLocalhost) {
    return notFound(); 
  }

  // Se passou no teste, mostra a página admin
  return <>{children}</>;
}
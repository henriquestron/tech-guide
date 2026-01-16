// src/app/admin/layout.tsx

// Força o Next.js a não criar cache estático dessa página.
// Isso garante que você sempre veja os dados mais recentes do banco.
export const dynamic = 'force-dynamic';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  // 🔓 REMOVIDO: Travas de segurança (isRobotServer, isLocalhost).
  // Agora a Vercel vai conseguir carregar a página e mostrar a tela de Login.
  return <>{children}</>;
}
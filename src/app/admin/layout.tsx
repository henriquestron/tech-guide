export const dynamic = 'force-dynamic'; // Importante: Garante que a página admin nunca faça cache

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  // A trava de segurança antiga (IS_ROBOT_SERVER) foi removida.
  // Agora, qualquer um pode acessar a URL /admin, mas só quem tem a senha
  // (validada no page.tsx) vai ver o painel.
  return <>{children}</>;
}
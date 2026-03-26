import { AuthBootstrap } from "@/components/auth/AuthBootstrap";
import { MainShell } from "@/components/layout/MainShell";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthBootstrap>
      <MainShell>{children}</MainShell>
    </AuthBootstrap>
  );
}

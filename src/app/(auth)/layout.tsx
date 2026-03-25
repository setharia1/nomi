export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh nomi-ambient flex flex-col items-stretch justify-stretch">
      {children}
    </div>
  );
}

import { Card } from "@/components/ui/card";
import { LoginForm } from "@/features/auth/components/login-form";

export const metadata = {
  title: "Sign in — QuoteFlow",
};

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center gap-6 px-4 py-8">
      <Card className="flex flex-col gap-6 p-6 sm:p-8">
        <header className="flex flex-col gap-1 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            QuoteFlow
          </h1>
          <p className="text-sm text-slate-600">
            Quote manager for small businesses — sign in to continue.
          </p>
        </header>
        <LoginForm />
      </Card>
    </main>
  );
}

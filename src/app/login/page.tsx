import { LoginForm } from "@/features/auth/components/login-form";

export const metadata = {
  title: "Sign in — QuoteFlow",
};

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center gap-6 px-4 py-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
          Sign in to QuoteFlow
        </h1>
        <p className="text-sm text-gray-600">
          Enter your email and password to continue.
        </p>
      </header>
      <LoginForm />
    </main>
  );
}

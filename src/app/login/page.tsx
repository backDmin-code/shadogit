"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Loader2, LogIn, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  return (
    <React.Suspense fallback={null}>
      <LoginInner />
    </React.Suspense>
  );
}

function LoginInner() {
  const router = useRouter();
  const search = useSearchParams();
  const callbackUrl = search?.get("callbackUrl") ?? "/admin";
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl,
    });
    setLoading(false);
    if (res?.error) {
      toast.error("Не удалось войти", {
        description: "Проверь email и пароль.",
      });
      return;
    }
    toast.success("Вход выполнен");
    router.push(res?.url ?? callbackUrl);
    router.refresh();
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-12">
      <div className="absolute inset-0 grid-bg opacity-50" aria-hidden />
      <div className="relative w-full max-w-md">
        <div className="tile-glow rounded-3xl p-8 backdrop-blur-xl">
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[linear-gradient(135deg,#7c5cff_0%,#22d3ee_100%)] shadow-glow">
              <ShieldCheck className="h-6 w-6 text-white" />
            </div>
            <h1 className="mt-4 text-2xl font-bold tracking-tight">
              Войти в админку
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Создавай и редактируй документацию.
            </p>
          </div>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Пароль</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <Button
              type="submit"
              variant="gradient"
              className="w-full"
              size="lg"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LogIn className="h-4 w-4" />
              )}
              Войти
            </Button>
          </form>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            Нет аккаунта? Поменяй <code className="rounded bg-muted px-1 py-0.5">ADMIN_EMAIL</code> и{" "}
            <code className="rounded bg-muted px-1 py-0.5">ADMIN_PASSWORD</code> в{" "}
            <code className="rounded bg-muted px-1 py-0.5">.env</code>, потом запусти{" "}
            <code className="rounded bg-muted px-1 py-0.5">npm run db:seed</code>.
          </p>
        </div>
        <div className="mt-6 text-center text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition-colors">
            ← На главную
          </Link>
        </div>
      </div>
    </div>
  );
}

"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Loader2, LogIn, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
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
    <div className="relative flex min-h-screen items-center justify-center px-4 py-12 z-10">
      <div className="hero-orb1" />
      <div className="hero-orb2" />
      <div className="relative w-full max-w-[420px]">
        <div className="rounded-xl border border-border bg-surface p-8 shadow-glow-lg backdrop-blur-xl">
          <div className="mb-7 flex flex-col items-center text-center">
            <div className="logo-mark !h-12 !w-12 !rounded-xl">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="hero-eyebrow mt-5 !mb-0 mx-auto">Auth</div>
            <h1 className="mt-3 font-display text-2xl font-semibold tracking-tight">
              Войти в админку
            </h1>
            <p className="mt-1.5 text-[13px] text-text-dim">
              Создавай и редактируй документацию.
            </p>
          </div>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-1.5">
              <Label htmlFor="email" className="font-mono text-2xs uppercase tracking-wider text-text-dimmer">
                Email
              </Label>
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
            <div className="space-y-1.5">
              <Label htmlFor="password" className="font-mono text-2xs uppercase tracking-wider text-text-dimmer">
                Пароль
              </Label>
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
            <button
              type="submit"
              disabled={loading}
              className="btn-cta w-full justify-center !py-2.5 !text-[13px]"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LogIn className="h-3.5 w-3.5" />
              )}
              Войти
            </button>
          </form>
          <p className="mt-6 text-center text-2xs font-mono uppercase tracking-wider text-text-dimmer leading-relaxed">
            Нет аккаунта? Поменяй <code className="inline-code !text-[10px]">ADMIN_EMAIL</code> и{" "}
            <code className="inline-code !text-[10px]">ADMIN_PASSWORD</code> в{" "}
            <code className="inline-code !text-[10px]">.env</code>
          </p>
        </div>
        <div className="mt-6 text-center font-mono text-2xs uppercase tracking-wider text-text-dimmer">
          <Link href="/" className="hover:text-primary transition-colors">
            ← На главную
          </Link>
        </div>
      </div>
    </div>
  );
}

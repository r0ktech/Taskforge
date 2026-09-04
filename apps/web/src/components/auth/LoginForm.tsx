"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Input, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useSession } from "@/providers/SessionProvider";

export function LoginForm() {
  const router = useRouter();
  const { refresh } = useSession();
  const [email, setEmail] = React.useState("ava@taskforge.dev");
  const [password, setPassword] = React.useState("password123");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong");
      return;
    }
    await refresh();
    router.push("/home");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
      </div>
      {error && <p className="rounded-md bg-danger/10 px-3 py-2 text-[13px] text-danger">{error}</p>}
      <Button type="submit" className="w-full" size="lg" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in"}
      </Button>
      <p className="rounded-md border border-border bg-surface-raised px-3 py-2 text-[12px] text-ink-muted">
        Demo account pre-filled — <span className="font-medium text-ink">ava@taskforge.dev</span> / password123
      </p>
      <p className="text-center text-[13px] text-ink-muted">
        New here?{" "}
        <Link href="/signup" className="font-medium text-accent hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}

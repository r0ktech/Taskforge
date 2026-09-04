"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Input, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useSession } from "@/providers/SessionProvider";

export function SignupForm() {
  const router = useRouter();
  const { refresh } = useSession();
  const [form, setForm] = React.useState({ name: "", email: "", password: "", orgName: "" });
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(form),
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
        <Label htmlFor="name">Full name</Label>
        <Input id="name" required value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Ava Whitfield" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="orgName">Organization name</Label>
        <Input id="orgName" required value={form.orgName} onChange={(e) => update("orgName", e.target.value)} placeholder="Acme Inc." />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="email">Work email</Label>
        <Input id="email" type="email" required value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="you@company.com" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          required
          minLength={8}
          value={form.password}
          onChange={(e) => update("password", e.target.value)}
          placeholder="At least 8 characters"
        />
      </div>
      {error && <p className="rounded-md bg-danger/10 px-3 py-2 text-[13px] text-danger">{error}</p>}
      <Button type="submit" className="w-full" size="lg" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create your organization"}
      </Button>
      <p className="text-center text-[13px] text-ink-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-accent hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}

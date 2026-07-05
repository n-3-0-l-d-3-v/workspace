"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/src/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState<"signin" | "signup" | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const submitter = (event.nativeEvent as SubmitEvent)
      .submitter as HTMLButtonElement | null;
    const intent = submitter?.value === "signup" ? "signup" : "signin";

    setLoading(intent);
    setMessage(null);

    if (!email || !password) {
      setLoading(null);
      setMessage("Enter both email and password.");
      return;
    }

    if (intent === "signin") {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setMessage(error.message);
        setLoading(null);
        return;
      }

      router.push("/dashboard");
      router.refresh();
      return;
    }

    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      setMessage(error.message);
      setLoading(null);
      return;
    }

    if (data.session) {
      router.push("/dashboard");
      router.refresh();
      return;
    }

    setLoading(null);
    setMessage("Check your email to confirm the account, then sign in.");
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-300" htmlFor="email">
          Email
        </label>
        <input
          className="w-full rounded-2xl border border-white/10 bg-zinc-900 px-4 py-3 text-zinc-100 outline-none transition placeholder:text-zinc-500 focus:border-white/20"
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-300" htmlFor="password">
          Password
        </label>
        <input
          className="w-full rounded-2xl border border-white/10 bg-zinc-900 px-4 py-3 text-zinc-100 outline-none transition placeholder:text-zinc-500 focus:border-white/20"
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
        />
      </div>

      {message ? <p className="text-sm text-amber-300">{message}</p> : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          className="rounded-2xl bg-white px-4 py-3 font-medium text-zinc-950 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
          value="signin"
          type="submit"
          disabled={loading !== null}
        >
          {loading === "signin" ? "Signing in..." : "Sign in"}
        </button>
        <button
          className="rounded-2xl border border-white/10 bg-zinc-900 px-4 py-3 font-medium text-white transition hover:border-white/20 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
          value="signup"
          type="submit"
          disabled={loading !== null}
        >
          {loading === "signup" ? "Creating..." : "Sign up"}
        </button>
      </div>
    </form>
  );
}

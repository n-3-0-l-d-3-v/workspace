import { redirect } from "next/navigation";
import { createClient } from "@/src/lib/supabase/server";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 px-4 py-12 text-zinc-100">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-zinc-900/70 p-10 shadow-2xl shadow-black/30 backdrop-blur-xl">
        <div className="mb-10 space-y-4 text-center">
          <h1 className="text-5xl font-semibold tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent font-serif">
            Abstra
          </h1>
          <p className="text-sm text-zinc-400">Your intelligent workspace</p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}

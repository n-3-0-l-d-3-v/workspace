import { redirect } from "next/navigation"
import { createClient } from "@/src/lib/supabase/server"
import { SignOutButton } from "./sign-out-button"

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 py-12 text-zinc-100">
      <section className="w-full max-w-lg rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/20 backdrop-blur">
        <p className="text-sm uppercase tracking-[0.25em] text-zinc-400">Dashboard</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Welcome, {user.email}</h1>
        <p className="mt-3 text-sm leading-6 text-zinc-400">
          You are signed in and protected by the Supabase session.
        </p>
        <div className="mt-8">
          <SignOutButton />
        </div>
      </section>
    </main>
  )
}
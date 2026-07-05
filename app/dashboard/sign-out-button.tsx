"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/src/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      className="rounded-2xl bg-white px-4 py-3 font-medium text-zinc-950 transition hover:bg-zinc-200"
      type="button"
      onClick={handleSignOut}
    >
      Sign out
    </button>
  );
}

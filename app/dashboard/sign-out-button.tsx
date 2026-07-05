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
      className="rounded-2xl bg-white px-6 py-3 font-semibold text-zinc-950 transition-all duration-200 hover:bg-zinc-200 cursor-pointer"
      type="button"
      onClick={handleSignOut}
    >
      Sign out
    </button>
  );
}

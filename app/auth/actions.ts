"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signUp(formData: FormData) {
  const supabase = await createClient();

  const fullName = String(
    formData.get("fullName") ?? ""
  ).trim();

  const email = String(
    formData.get("email") ?? ""
  ).trim();

  const password = String(
    formData.get("password") ?? ""
  );

  if (!email || !password) {
    redirect(
      `/auth/sign-up?error=${encodeURIComponent(
        "Email and password are required."
      )}`
    );
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000";

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo:
        `${siteUrl}/auth/callback?next=/`,
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) {
    redirect(
      `/auth/sign-up?error=${encodeURIComponent(
        error.message
      )}`
    );
  }

  if (data.session) {
    revalidatePath("/", "layout");
    redirect("/");
  }

  redirect("/auth/check-email");
}

export async function signIn(formData: FormData) {
  const supabase = await createClient();

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const requestedNext = String(formData.get("next") ?? "/");

  const next =
    requestedNext.startsWith("/") &&
    !requestedNext.startsWith("//")
      ? requestedNext
      : "/";

  if (!email || !password) {
    redirect(
      `/auth/login?error=${encodeURIComponent(
        "Email and password are required."
      )}`
    );
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect(
      `/auth/login?error=${encodeURIComponent(
        error.message
      )}&next=${encodeURIComponent(next)}`
    );
  }

  revalidatePath("/", "layout");
  redirect(next);
}

export async function signOut() {
  const supabase = await createClient();

  await supabase.auth.signOut();

  revalidatePath("/", "layout");
  redirect("/auth/login");
}

export async function updateProfile(formData: FormData) {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ data: { full_name: fullName } });
  if (error) redirect(`/settings?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/", "layout");
  redirect("/settings?updated=1");
}

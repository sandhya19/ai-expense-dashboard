import { updateProfile } from "@/app/auth/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ error?: string; updated?: string }> }) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const fullName = typeof user?.user_metadata.full_name === "string" ? user.user_metadata.full_name : "";
  return <div className="mx-auto max-w-2xl"><p className="text-sm font-medium text-primary">Your ReceiptBrain</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Personal settings</h1><p className="mt-2 text-muted-foreground">Keep the details behind your spending companion up to date.</p><Card className="mt-7"><CardHeader><CardTitle>Your profile</CardTitle></CardHeader><CardContent><form action={updateProfile} className="space-y-4"><div><label htmlFor="fullName" className="text-sm font-medium">Name</label><input id="fullName" name="fullName" defaultValue={fullName} className="mt-2 w-full rounded-md border bg-background px-3 py-2" placeholder="Your name" /></div><div><label className="text-sm font-medium">Email</label><p className="mt-2 rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">{user?.email ?? "No email available"}</p></div>{params.error && <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{params.error}</p>}{params.updated && <p className="rounded-md bg-emerald-500/10 p-3 text-sm text-emerald-700">Profile updated.</p>}<button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Save profile</button></form></CardContent></Card></div>;
}

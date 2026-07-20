import { Sidebar } from "@/components/layout/sidebar";
import { TopNav } from "@/components/layout/top-nav";
import { createClient } from "@/lib/supabase/server";

export async function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const fullName =
    typeof user?.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : null;

  if (!user) return <>{children}</>;

  return (
    <div className="flex min-h-screen bg-muted/30">
      <Sidebar />

      <div className="min-w-0 flex-1">
        <TopNav
          fullName={fullName}
          email={user?.email ?? null}
        />

        <main className="p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

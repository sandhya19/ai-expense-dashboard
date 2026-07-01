import Link from "next/link";
import { signIn } from "../actions";

type LoginPageProps = {
  searchParams: Promise<{
    next?: string;
    error?: string;
  }>;
};

export default async function LoginPage({
  searchParams,
}: LoginPageProps) {
  const params = await searchParams;

  const next =
    params.next?.startsWith("/") &&
    !params.next.startsWith("//")
      ? params.next
      : "/";

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-xl border bg-background p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">
          Sign in
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Sign in to upload and manage receipts.
        </p>

        {params.error && (
          <p className="mt-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {params.error}
          </p>
        )}

        <form action={signIn} className="mt-6 space-y-4">
          <input
            type="hidden"
            name="next"
            value={next}
          />

          <div className="space-y-2">
            <label
              htmlFor="email"
              className="text-sm font-medium"
            >
              Email
            </label>

            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="w-full rounded-md border bg-background px-3 py-2"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="password"
              className="text-sm font-medium"
            >
              Password
            </label>

            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              minLength={8}
              className="w-full rounded-md border bg-background px-3 py-2"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-md bg-primary px-4 py-2 text-primary-foreground"
          >
            Sign in
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          No account?{" "}
          <Link
            href="/auth/sign-up"
            className="text-primary underline"
          >
            Create one
          </Link>
        </p>
      </div>
    </main>
  );
}
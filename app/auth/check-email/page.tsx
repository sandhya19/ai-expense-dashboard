import Link from "next/link";

export default function CheckEmailPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-xl border bg-background p-6 text-center shadow-sm">
        <h1 className="text-2xl font-semibold">
          Check your email
        </h1>

        <p className="mt-3 text-sm text-muted-foreground">
          We sent you a confirmation link. Open the link
          before signing in.
        </p>

        <Link
          href="/auth/login"
          className="mt-6 inline-block text-sm text-primary underline"
        >
          Return to sign in
        </Link>
      </div>
    </main>
  );
}
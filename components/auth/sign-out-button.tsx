import { signOut } from "@/app/auth/actions";

export function SignOutButton() {
  return (
    <form action={signOut}>
      <button
        type="submit"
        className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
      >
        Sign out
      </button>
    </form>
  );
}
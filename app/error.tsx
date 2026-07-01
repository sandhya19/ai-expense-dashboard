"use client";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) { return <div className="grid min-h-[60vh] place-items-center"><div className="max-w-md rounded-xl border bg-card p-8 text-center"><AlertTriangle className="mx-auto size-10 text-destructive" /><h2 className="mt-4 text-xl font-semibold">Dashboard data failed to load</h2><p className="mt-2 text-sm text-muted-foreground">Check the Supabase connection and database policies, then try again.</p><Button className="mt-6" onClick={reset}>Try again</Button></div></div>; }

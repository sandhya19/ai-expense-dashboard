import Link from "next/link";
import { BrainCircuit, ReceiptText, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  { icon: ReceiptText, title: "Receipt intelligence", text: "Upload a receipt and turn the small print into a clear money moment." },
  { icon: Sparkles, title: "Your spending story", text: "See calm monthly reflections instead of another spreadsheet." },
  { icon: BrainCircuit, title: "Personal AI guidance", text: "Discover the habits and choices shaping your everyday spending." },
];

export function LandingPage() {
  return <main className="min-h-screen bg-gradient-to-b from-violet-50 via-background to-background px-5 py-6 dark:from-violet-950/20 sm:px-8"><header className="mx-auto flex max-w-6xl items-center"><Link href="/" className="flex items-center gap-2 font-semibold"><span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground"><ReceiptText className="size-5" /></span>ReceiptBrain</Link></header><section className="mx-auto max-w-4xl py-24 text-center sm:py-32"><p className="text-sm font-medium text-primary">Your AI personal finance companion</p><h1 className="mt-5 text-4xl font-semibold tracking-tight sm:text-6xl">Your receipts have a story.<br />Meet the intelligence behind it.</h1><p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">ReceiptBrain turns everyday receipts into a calm, personal understanding of your money—without making you feel like an accountant.</p><div className="mt-9 flex flex-wrap justify-center gap-3"><Button className="h-11 px-5" asChild><Link href="/auth/sign-up">Start your spending story</Link></Button><Button className="h-11 px-5" variant="outline" asChild><Link href="/dashboard?demo=1">Explore Demo Mode</Link></Button><Button className="h-11 px-5" variant="ghost" asChild><Link href="/auth/login">I already have an account</Link></Button></div></section><section className="mx-auto grid max-w-6xl gap-4 pb-16 md:grid-cols-3">{features.map(({ icon: Icon, title, text }) => <article key={title} className="rounded-2xl border bg-card/80 p-6 shadow-sm"><span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="size-5" /></span><h2 className="mt-5 text-lg font-semibold">{title}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p></article>)}</section></main>;
}

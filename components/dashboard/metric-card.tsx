import type { LucideIcon } from "lucide-react";
import { ArrowUpRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
export function MetricCard({ title, value, detail, icon: Icon }: { title: string; value: string; detail: string; icon: LucideIcon }) { return <Card><CardContent className="p-5"><div className="flex items-start justify-between"><div><p className="text-sm text-muted-foreground">{title}</p><p className="mt-2 text-2xl font-bold tracking-tight">{value}</p></div><span className="rounded-lg bg-primary/10 p-2 text-primary"><Icon className="size-5" /></span></div><p className="mt-3 flex items-center gap-1 text-xs text-muted-foreground"><ArrowUpRight className="size-3 text-emerald-600" />{detail}</p></CardContent></Card>; }

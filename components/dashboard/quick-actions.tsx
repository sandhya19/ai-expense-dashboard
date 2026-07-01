import Link from "next/link";
import { MessageSquareText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UploadDialog } from "@/components/dashboard/upload-dialog";
export function QuickActions() { return <div className="flex flex-wrap gap-2"><UploadDialog /><UploadDialog camera /><Button variant="outline" asChild><Link href="/ai-chat"><MessageSquareText className="size-4" />Ask AI</Link></Button></div>; }

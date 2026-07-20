import { NextResponse } from "next/server";
import { getDashboardData } from "@/lib/dashboard";

export async function GET() {
  try {
    const dashboard = await getDashboardData();
    return NextResponse.json({
      story: dashboard.story,
      dna: dashboard.dna,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Unable to load spending insights:", error);
    return NextResponse.json(
      { error: "Unable to load spending insights right now." },
      { status: 500 }
    );
  }
}

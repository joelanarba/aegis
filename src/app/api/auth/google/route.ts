import { NextResponse } from "next/server";
import { getAuthUrl } from "@/lib/auth";

/**
 * GET /api/auth/google
 * Redirects the user to Google's OAuth2 consent screen.
 */
export async function GET() {
  try {
    const authUrl = getAuthUrl();
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error("Failed to generate auth URL:", error);
    return NextResponse.json(
      { error: "Failed to initiate authentication" },
      { status: 500 }
    );
  }
}

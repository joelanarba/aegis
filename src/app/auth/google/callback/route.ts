import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens } from "@/lib/auth";

/**
 * GET /auth/google/callback
 * Handles the OAuth2 callback from Google after user consent.
 * Exchanges the authorization code for tokens, stores them, and redirects to dashboard.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    console.error("OAuth2 error:", error);
    return NextResponse.redirect(
      new URL(`/?error=auth_denied`, request.url)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL(`/?error=no_code`, request.url)
    );
  }

  try {
    const { userId, email } = await exchangeCodeForTokens(code);

    console.log(`✅ User authenticated: ${email} (${userId})`);

    // Set a simple session cookie with the user ID
    // In production, use a proper JWT or session management
    const response = NextResponse.redirect(
      new URL("/dashboard", request.url)
    );

    response.cookies.set("aegis_user_id", userId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });

    response.cookies.set("aegis_user_email", email, {
      httpOnly: false, // Allow client-side access for display
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("Token exchange failed:", err);
    return NextResponse.redirect(
      new URL(`/?error=token_exchange_failed`, request.url)
    );
  }
}

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Server-side only packages (Firebase Admin, googleapis) should not be bundled for client
  serverExternalPackages: ["firebase-admin", "googleapis"],
};

export default nextConfig;

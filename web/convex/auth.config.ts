import { AuthConfig } from "convex/server";

export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN || "https://gorgeous-rattler-9544.clerk.accounts.dev",
      applicationID: "convex",
    },
  ]
} satisfies AuthConfig;
import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex, crossDomain } from "@convex-dev/better-auth/plugins";
import { components } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import { query } from "./_generated/server";
import { betterAuth, type BetterAuthOptions } from "better-auth/minimal";
import authConfig from "./auth.config";

const defaultLocalSiteUrl = "http://taskflow.localhost:1355";
const siteUrl = process.env.SITE_URL ?? defaultLocalSiteUrl;
const taskflowSubdomainOriginPattern =
  /^http:\/\/[a-z0-9-]+\.taskflow\.localhost:1355$/i;
const staticTrustedOrigins = [
  siteUrl,
  defaultLocalSiteUrl,
  "http://localhost:1355",
  "http://localhost:5173",
];

export const authComponent = createClient<DataModel>(components.betterAuth);

export const createAuth = (ctx: GenericCtx<DataModel>) => {
  return betterAuth({
    trustedOrigins: (request) => {
      const requestOrigin = request?.headers.get("origin");
      if (requestOrigin && taskflowSubdomainOriginPattern.test(requestOrigin)) {
        return [...staticTrustedOrigins, requestOrigin];
      }
      return staticTrustedOrigins;
    },
    database: authComponent.adapter(ctx),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },
    plugins: [
      crossDomain({ siteUrl }),
      convex({ authConfig }),
    ],
  } satisfies BetterAuthOptions);
};

// Returns the current user's Convex profile (derived from JWT — no userId arg needed)
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    return ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
  },
});

export { getUser, listUsers } from "./users/queries";
export { storeUser } from "./users/mutations";

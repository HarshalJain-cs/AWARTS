export default {
  providers: [
    {
      domain: process.env.CLERK_DOMAIN ?? "https://adjusted-elk-93.clerk.accounts.dev",
      applicationID: "convex",
    },
  ],
};

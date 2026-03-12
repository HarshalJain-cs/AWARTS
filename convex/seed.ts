import { mutation } from "./_generated/server";
import { getCurrentUser } from "./users";

// Run once to seed countries_to_regions data (admin only)
export const seedCountries = mutation({
  args: {},
  handler: async (ctx) => {
    const me = await getCurrentUser(ctx);
    if (!me) throw new Error("Not authenticated");
    // Admin-only guard
    const adminIds = (process.env.ADMIN_CLERK_IDS ?? "").split(",").map((id) => id.trim()).filter(Boolean);
    if (adminIds.length > 0 && !adminIds.includes(me.clerkId)) {
      throw new Error("Forbidden: admin access required");
    }
    // Check if already seeded
    const existing = await ctx.db.query("countries_to_regions").first();
    if (existing) return { message: "Already seeded" };

    const countries = [
      { countryCode: "US", countryName: "United States", region: "north-america" },
      { countryCode: "CA", countryName: "Canada", region: "north-america" },
      { countryCode: "MX", countryName: "Mexico", region: "latin-america" },
      { countryCode: "GB", countryName: "United Kingdom", region: "europe" },
      { countryCode: "DE", countryName: "Germany", region: "europe" },
      { countryCode: "FR", countryName: "France", region: "europe" },
      { countryCode: "NL", countryName: "Netherlands", region: "europe" },
      { countryCode: "SE", countryName: "Sweden", region: "europe" },
      { countryCode: "PL", countryName: "Poland", region: "europe" },
      { countryCode: "ES", countryName: "Spain", region: "europe" },
      { countryCode: "IT", countryName: "Italy", region: "europe" },
      { countryCode: "PT", countryName: "Portugal", region: "europe" },
      { countryCode: "CH", countryName: "Switzerland", region: "europe" },
      { countryCode: "AT", countryName: "Austria", region: "europe" },
      { countryCode: "BE", countryName: "Belgium", region: "europe" },
      { countryCode: "NO", countryName: "Norway", region: "europe" },
      { countryCode: "DK", countryName: "Denmark", region: "europe" },
      { countryCode: "FI", countryName: "Finland", region: "europe" },
      { countryCode: "IE", countryName: "Ireland", region: "europe" },
      { countryCode: "CZ", countryName: "Czech Republic", region: "europe" },
      { countryCode: "RO", countryName: "Romania", region: "europe" },
      { countryCode: "HU", countryName: "Hungary", region: "europe" },
      { countryCode: "UA", countryName: "Ukraine", region: "europe" },
      { countryCode: "GR", countryName: "Greece", region: "europe" },
      { countryCode: "IN", countryName: "India", region: "asia" },
      { countryCode: "CN", countryName: "China", region: "asia" },
      { countryCode: "JP", countryName: "Japan", region: "asia" },
      { countryCode: "KR", countryName: "South Korea", region: "asia" },
      { countryCode: "SG", countryName: "Singapore", region: "asia" },
      { countryCode: "TW", countryName: "Taiwan", region: "asia" },
      { countryCode: "HK", countryName: "Hong Kong", region: "asia" },
      { countryCode: "TH", countryName: "Thailand", region: "asia" },
      { countryCode: "VN", countryName: "Vietnam", region: "asia" },
      { countryCode: "PH", countryName: "Philippines", region: "asia" },
      { countryCode: "MY", countryName: "Malaysia", region: "asia" },
      { countryCode: "ID", countryName: "Indonesia", region: "asia" },
      { countryCode: "PK", countryName: "Pakistan", region: "asia" },
      { countryCode: "BD", countryName: "Bangladesh", region: "asia" },
      { countryCode: "LK", countryName: "Sri Lanka", region: "asia" },
      { countryCode: "AU", countryName: "Australia", region: "oceania" },
      { countryCode: "NZ", countryName: "New Zealand", region: "oceania" },
      { countryCode: "BR", countryName: "Brazil", region: "latin-america" },
      { countryCode: "AR", countryName: "Argentina", region: "latin-america" },
      { countryCode: "CL", countryName: "Chile", region: "latin-america" },
      { countryCode: "CO", countryName: "Colombia", region: "latin-america" },
      { countryCode: "PE", countryName: "Peru", region: "latin-america" },
      { countryCode: "UY", countryName: "Uruguay", region: "latin-america" },
      { countryCode: "NG", countryName: "Nigeria", region: "africa" },
      { countryCode: "ZA", countryName: "South Africa", region: "africa" },
      { countryCode: "EG", countryName: "Egypt", region: "africa" },
      { countryCode: "KE", countryName: "Kenya", region: "africa" },
      { countryCode: "GH", countryName: "Ghana", region: "africa" },
      { countryCode: "MA", countryName: "Morocco", region: "africa" },
      { countryCode: "TN", countryName: "Tunisia", region: "africa" },
      { countryCode: "ET", countryName: "Ethiopia", region: "africa" },
      { countryCode: "IL", countryName: "Israel", region: "asia" },
      { countryCode: "AE", countryName: "United Arab Emirates", region: "asia" },
      { countryCode: "SA", countryName: "Saudi Arabia", region: "asia" },
      { countryCode: "TR", countryName: "Turkey", region: "europe" },
      { countryCode: "RU", countryName: "Russia", region: "europe" },
    ];

    for (const c of countries) {
      await ctx.db.insert("countries_to_regions", c);
    }
    return { message: `Seeded ${countries.length} countries` };
  },
});

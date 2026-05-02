import { internalMutation } from "./_generated/server";

/**
 * One-time migration: backfill `participantKey` on existing conversations.
 *
 * Run via Convex dashboard: internal.migrations.backfillParticipantKeys
 */
export const backfillParticipantKeys = internalMutation({
  args: {},
  handler: async (ctx) => {
    const conversations = await ctx.db.query("conversations").collect();
    let updated = 0;

    for (const conv of conversations) {
      if (conv.participantKey) continue; // already set

      if (conv.participantIds.length === 2) {
        const [a, b] = conv.participantIds;
        const key = a < b ? `${a}_${b}` : `${b}_${a}`;
        await ctx.db.patch(conv._id, { participantKey: key });
        updated++;
      }
    }

    return { updated, total: conversations.length };
  },
});

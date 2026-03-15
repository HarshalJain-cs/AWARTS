import { cronJobs } from "convex/server";

const crons = cronJobs();

// Note: Weekly digest cron will be enabled after running `npx convex dev`
// to generate internal API types. Uncomment the line below:
// crons.weekly("weekly email digest", { dayOfWeek: "monday", hourUTC: 9, minuteUTC: 0 }, internal.digest.sendWeeklyDigests);

export default crons;

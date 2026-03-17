import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Weekly digest email — every Monday at 9:00 AM UTC
crons.weekly("weekly email digest", { dayOfWeek: "monday", hourUTC: 9, minuteUTC: 0 }, internal.digest.sendWeeklyDigests);

export default crons;

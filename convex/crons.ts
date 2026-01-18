import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Run cleanup every 24 hours to delete old rooms and save statistics
crons.interval(
  "cleanup old rooms",
  { hours: 24 }, // every 24 hours
  internal.cleanup.cleanupOldRooms
);

export default crons;

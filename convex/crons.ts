import { cronJobs } from "convex/server";
import { api } from "./_generated/api";

const crons = cronJobs();

crons.interval(
  "Run Trading Algo Scanner",
  { minutes: 15 },
  api.algo.runScanner,
  {}
);

export default crons;

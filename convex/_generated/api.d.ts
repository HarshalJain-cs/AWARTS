/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as ai from "../ai.js";
import type * as cliAuth from "../cliAuth.js";
import type * as feed from "../feed.js";
import type * as http from "../http.js";
import type * as leaderboard from "../leaderboard.js";
import type * as posts from "../posts.js";
import type * as prompts from "../prompts.js";
import type * as search from "../search.js";
import type * as seed from "../seed.js";
import type * as social from "../social.js";
import type * as upload from "../upload.js";
import type * as usage from "../usage.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  ai: typeof ai;
  cliAuth: typeof cliAuth;
  feed: typeof feed;
  http: typeof http;
  leaderboard: typeof leaderboard;
  posts: typeof posts;
  prompts: typeof prompts;
  search: typeof search;
  seed: typeof seed;
  social: typeof social;
  upload: typeof upload;
  usage: typeof usage;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};

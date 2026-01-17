/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as game from "../game.js";
import type * as game_chat from "../game/chat.js";
import type * as game_fuzzyMatching from "../game/fuzzyMatching.js";
import type * as game_gameFlow from "../game/gameFlow.js";
import type * as game_guessHandling from "../game/guessHandling.js";
import type * as game_queries from "../game/queries.js";
import type * as game_turnManagement from "../game/turnManagement.js";
import type * as game_wordSelection from "../game/wordSelection.js";
import type * as packs from "../packs.js";
import type * as players from "../players.js";
import type * as rooms from "../rooms.js";
import type * as words from "../words.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  game: typeof game;
  "game/chat": typeof game_chat;
  "game/fuzzyMatching": typeof game_fuzzyMatching;
  "game/gameFlow": typeof game_gameFlow;
  "game/guessHandling": typeof game_guessHandling;
  "game/queries": typeof game_queries;
  "game/turnManagement": typeof game_turnManagement;
  "game/wordSelection": typeof game_wordSelection;
  packs: typeof packs;
  players: typeof players;
  rooms: typeof rooms;
  words: typeof words;
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

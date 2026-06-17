import type { LocalePromptPools } from "./types";
import { CATEGORIZED_EN } from "../categories/en";
import { buildLocalePools } from "../categories/merge";

export const POOLS_EN: LocalePromptPools = buildLocalePools(CATEGORIZED_EN);

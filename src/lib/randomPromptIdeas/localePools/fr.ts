import type { LocalePromptPools } from "./types";
import { CATEGORIZED_FR } from "../categories/fr";
import { buildLocalePools } from "../categories/merge";

export const POOLS_FR: LocalePromptPools = buildLocalePools(CATEGORIZED_FR);

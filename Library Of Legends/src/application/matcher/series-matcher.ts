/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: SeriesMatcher

Architecture Layer..: Application

Module..............: Matcher

Module ID...........: LOL-MOD-MATCH-0001

LOL-ID..............: LOL-MATCH-SER-0001

File................: series-matcher.ts

Location............
Library Of Legends/src/application/matcher/

Version.............: 1.0.0

Status..............: Core

Lifecycle...........: Production

Description.........

Matches parsed series data with TMDB.

===============================================================================
*/

import { TMDBClient } from "../../infrastructure/tmdb/tmdb-client";
import { EpisodeParseResult } from "../parser/episode-parser";

export class SeriesMatcher {

    public static async match(parsed: EpisodeParseResult) {
        if (!parsed.title) return;
        return await TMDBClient.findSeries(parsed.title);
    }
}
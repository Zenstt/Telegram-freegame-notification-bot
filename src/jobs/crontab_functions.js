"use strict";

import { checkCurrentTitles } from "../services/checkers.js";
import { searchFreeEpicGamesGames, searchFreeGogGamesGames } from "../services/searchers.js";
import { sendToUsers } from "../services/telegram_functions.js";

export async function crontGames(bot, type) {
    let extra_data = await getExtraData(type);
    if (!extra_data) {
        console.log("No extra data for", type);
        return;
    }

    let new_titles = await checkCurrentTitles(extra_data.current_titles, type);
    console.log("New", type, "titles:", new_titles.length);
    console.log(new_titles.map(t => t.title));
    // If there's a new title, send to user
    if (new_titles.length) {
        sendToUsers(bot, type, null, new_titles || null);
    }
}

async function getExtraData(type) {
    if (type == "epic_games") {
        return searchFreeEpicGamesGames().catch(console.log);
    } else if (type == "gog_games") {
        return searchFreeGogGamesGames().catch(console.log);
    } else {
        return null;
    }
}
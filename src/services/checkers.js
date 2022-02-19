"use strict";

import { Find, UpdateOne, UpdateMany } from "./mongo/mongo.js";


export async function checkCurrentTitles(new_titles, type) {

    // Variable to return the new titles
    let filtered_titles = [];

    // Get current active games 
    let active_games = await Find("games", { active: true, type }, {});
    console.log('Active', type, 'games:', active_games.length);
    console.log(active_games.map(a => a.title));

    // Iterate list of available games
    for (let n of new_titles) {
        // Find if the title is on the active ones
        let found = (active_games || []).find(a => a.title == n.title);
        if (!found) {
            // If is not in the actives, is a new game, add to the list to send to the user

            // Check if that games was already before (Just because I can)
            let rerun = await Find("games", { active: false, title: n.title, type }, {}, {}, true);
            if (rerun) { n.rerun = true; }

            // Add to the list
            filtered_titles.push(n);
        }
        // Set the game as active
        n.active = true;

        // Update/Create the game in DB
        await UpdateOne('games', { title: n.title, type }, { $set: n }, { upsert: true });
    }

    // Update every other active that aren't the ones checked with active:false
    let titles = new_titles.map(a => a.title);
    let query = { active: true, title: { $nin: titles }, type };
    await UpdateMany('games', query, { $set: { active: false } });

    // Returns new actives games
    return filtered_titles;
}
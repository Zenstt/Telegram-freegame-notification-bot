"use strict";
export async function waitAMoment(time) {
    time = time || time === 0 ? time : 1000;
    console.log("Waiting", time, '(' + (time / 1000) + 's)');
    return new Promise((resolve) => {
        setTimeout(resolve, time);
    });
}

function processUrlArray(data) {
    let single_games = '';
    if (data && data.length) {
        single_games = "Available games:";
        for (let t of data) {
            // single_games += `\n·${t.rerun ? '[Repeated]' : ''} ${t.title}\n${t.url}`;
            single_games += `\n· ${t.title}\n${t.url}`;
        }
    }
    return single_games;
}


export function getMesage() {
    return {
        epic_games: function (user, message, data) {
            let single_games = processUrlArray(data);
            return `
[REMINDER] 
Hello ${user.username || user.first_name}, new free epic games are available on the epic store.

${single_games}

You can check them out in the following link:
https://www.epicgames.com/store/es-ES/free-games
                    `;


        },
        gog_games: function (user, message, data) {
            let single_games = processUrlArray(data);
            return `
[ANNOUNCEMENT] 
Hello ${user.username || user.first_name}, new free gog game giveaway is available on gog webpage.

${single_games}

You can check them out in the following link on the front page:
https://www.gog.com/
                    `;


        }
    };
}
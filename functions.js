"use strict";
const request = require('request');
const { Find, UpdateOne, UpdateMany } = require('./modules/mongo/mongo');
const moment = require('moment');

function getUser(id, project = {}) {
    return Find('users', { id: id }, project, {}, true);
}

async function checkUser(msg) {
    // let test = JSON.parse(fs.readFileSync('../users_db.json'));
    // console.log('test: ', test);
    let user = await getUser(msg.from.id);
    if (!user) {
        console.log("New user!");
        await UpdateOne('users', { id: msg.from.id }, {
            $set: {
                id: msg.from.id,
                username: msg.from.username,
                first_name: msg.from.first_name,
                last_name: msg.from.last_name,
                joinedDate: moment().toDate(),
                lastDate: moment().toDate(),
                language_code: msg.from.language_code || null,
                admin: false,
                subscribed: {},
            }
        }, { upsert: true });
        return getUser(msg.from.id);
    } else {
        user.lastDate = moment().toDate();
        user.first_name = msg.from.first_name;
        user.last_name = msg.from.last_name;
        user.username = msg.from.username;
        UpdateOne('users', { id: msg.from.id }, {
            $set: {
                lastDate: user.lastDate,
                first_name: user.first_name,
                last_name: user.last_name,
                username: user.username
            }
        });
    }
    return user;
}

function updateUser(id, type, value) {
    return UpdateOne('users', { id: id }, { $set: { ["subscribed." + type]: value } });
}

async function checkCurrentTitles(new_titles) {

    // Variable to return the new titles
    let filtered_titles = [];

    // Get current active games 
    let active_games = await Find("games", { active: true }, {});
    console.log('Active games:', active_games.length);
    console.log(active_games.map(a => a.title));

    // Iterate list of available games
    for (let n of new_titles) {
        // Find if the title is on the active ones
        let found = (active_games || []).find(a => a.title == n.title);
        if (!found) {
            // If is not in the actives, is a new game, add to the list to send to the user

            // Check if that games was already before (Just for flexing that I can)
            let rerun = await Find("games", { active: false, title: n.title }, {}, {}, true);
            if (rerun) { n.rerun = true; }

            // Add to the list
            filtered_titles.push(n);
        }
        // Set the game as active
        n.active = true;

        // Update/Create the game in DB
        await UpdateOne('games', { title: n.title }, { $set: n }, { upsert: true });
    }

    // Update every other active that aren't the ones checked with active:false
    let titles = new_titles.map(a => a.title);
    let query = { active: true, title: { $nin: titles } };
    await UpdateMany('games', query, { $set: { active: false } });

    // Returns new actives games
    return filtered_titles;
}

async function sendToUsers(bot, type, message = null, extra_data = null) {

    if (!type) {
        // Wa-?
        console.log("No hay type?");
        return;
    }
    console.log("Got type", type);

    // Get users with that subscription
    let users = await Find('users', { ["subscribed." + type]: true }, { id: 1, username: 1, first_name: 1 });

    // Iterate the users
    for (let user of users) {
        console.log("Sending message to user", user.username || user.first_name);
        let text = get_message[type](user, message, extra_data);
        // if (user.username == "Zenstt") {
        console.log("##################");
        bot.sendMessage(user.id, text).catch((error) => {
            console.log("Error sending message to", user);
            if (error.response.statusCode === 403) {
                console.log("We been blocked!... Disabling that message to user", user);
                UpdateOne('users', { id: user.id }, { $set: { subscribed: {} } });
            }
        });
        // }
    }
}

const get_message = {
    epic_games: function (user, message, data) {
        console.log('data: ', data);
        let single_games = '';
        if (data && data.length) {
            single_games = "Available games:";
            for (let t of data) {
                single_games += `\n·${t.rerun ? '[Repeated]' : ''} ${t.title}\n${t.url}`;
            }
        }
        return `
[REMINDER] 
Hello ${user.username || user.first_name}, new free epic games are available on the epic store.

${single_games}

You can check them out in the following link:
https://www.epicgames.com/store/es-ES/free-games

                `;


    }
};

/**
 * 
 * @param {get|post} type 
 * @param {import('request').Options} options 
 * @returns {Promise<{error,response,body}>}
 */
function HTTPpetition(type, options) {
    return new Promise((resolve, reject) => {
        function result(error, response, body) {
            if (!error && response.statusCode === 200) {
                try {
                    let body_parsed = JSON.parse(body);
                    body = body_parsed;
                } catch (_err) {
                    console.log("Error parsing body", _err);
                    // :D...
                }
                resolve({ error, response, body });
            } else {
                reject({ error, response, body });
            }

        }
        if (type == "post") {
            console.log("Doing post");
            request.post(options, result);
        } else {
            request.get(options, result);
        }
    });
}

function searchFreeEpicGamesGames() {


    let url = "https://www.epicgames.com/store/backend/graphql-proxy";
    let obj = {
        // query: "query searchStoreQuery($allowCountries: String, $category: String, $count: Int, $country: String!, $keywords: String, $locale: String, $namespace: String, $sortBy: String, $sortDir: String, $start: Int, $tag: String, $withPrice: Boolean = false, $withPromotions: Boolean = false) {\n  Catalog {\n    searchStore(allowCountries: $allowCountries, category: $category, count: $count, country: $country, keywords: $keywords, locale: $locale, namespace: $namespace, sortBy: $sortBy, sortDir: $sortDir, start: $start, tag: $tag) {\n      elements {\n        title\n        id\n        namespace\n        description\n        effectiveDate\n        keyImages {\n          type\n          url\n        }\n        seller {\n          id\n          name\n        }\n        productSlug\n        urlSlug\n        url\n        items {\n          id\n          namespace\n        }\n        customAttributes {\n          key\n          value\n        }\n        categories {\n          path\n        }\n        price(country: $country) @include(if: $withPrice) {\n          totalPrice {\n            discountPrice\n            originalPrice\n            voucherDiscount\n            discount\n            currencyCode\n            currencyInfo {\n              decimals\n            }\n            fmtPrice(locale: $locale) {\n              originalPrice\n              discountPrice\n              intermediatePrice\n            }\n          }\n          lineOffers {\n            appliedRules {\n              id\n              endDate\n              discountSetting {\n                discountType\n              }\n            }\n          }\n        }\n        promotions(category: $category) @include(if: $withPromotions) {\n          promotionalOffers {\n            promotionalOffers {\n              startDate\n              endDate\n              discountSetting {\n                discountType\n                discountPercentage\n              }\n            }\n          }\n          upcomingPromotionalOffers {\n            promotionalOffers {\n              startDate\n              endDate\n              discountSetting {\n                discountType\n                discountPercentage\n              }\n            }\n          }\n        }\n      }\n      paging {\n        count\n        total\n      }\n    }\n  }\n}\n",
        query: `
            query searchStoreQuery($allowCountries: String, $category: String, $count: Int, $country: String!, $keywords: String, $locale: String, $namespace: String, $sortBy: String, $sortDir: String, $start: Int, $tag: String, $withPrice: Boolean = false, $withPromotions: Boolean = false) {
                  Catalog {
                    searchStore(allowCountries: $allowCountries, category: $category, count: $count, country: $country, keywords: $keywords, locale: $locale, namespace: $namespace, sortBy: $sortBy, sortDir: $sortDir, start: $start, tag: $tag) {
                        elements {
                            title
                            id
                            namespace
                            description
                            effectiveDate
                            keyImages { type url }
                            seller { id name }
                            productSlug
                            urlSlug
                            url
                            items { id namespace }            
                            customAttributes { key value }
                            categories { path }
                            price(country: $country) @include(if: $withPrice) {
                                totalPrice {
                                    discountPrice
                                    originalPrice
                                    voucherDiscount
                                    discount
                                    currencyCode
                                    currencyInfo {
                                        decimals
                                    }
                                    fmtPrice(locale: $locale) {
                                        originalPrice
                                        discountPrice
                                        intermediatePrice
                                    }
                                }
                                lineOffers {
                                    appliedRules {
                                    id
                                    endDate
                                    discountSetting {
                                        discountType
                                    }
                                }
                            }
                        }
                        promotions(category: $category) @include(if: $withPromotions) {
                            promotionalOffers {
                                promotionalOffers {
                                startDate
                                endDate
                                discountSetting {
                                    discountType
                                    discountPercentage
                                }
                            }
                        }
                        upcomingPromotionalOffers {
                            promotionalOffers {
                                startDate
                                endDate
                                discountSetting {
                                    discountType
                                    discountPercentage
                                }
                            }
                        }
                    }
                }
                paging {
                    count
                    total
                }
            }
          }
        }
            `,
        variables: { "category": "freegames", "sortBy": "effectiveDate", "sortDir": "asc", "count": 1000, "country": "ES", "allowCountries": "ES", "locale": "es-ES", "withPrice": true, "withPromotions": true }
        // variables: { "namespace": "epic", "country": "ES", "locale": "es-ES", count: 1000, withPrice: true, withPromotions: true, allowCountries: 'ES', category: 'freegames' }
    };

    return new Promise((resolve, reject) => {

        HTTPpetition('post', {
            url: url,
            body: JSON.stringify(obj),
            headers: {
                'User-Agent': 'Mozilla/5.0 (X11; Linux i686) AppleWebKit/537.11 (KHTML, like Gecko) Chrome/23.0.1271.64 Safari/537.11',
                "Accept": "application/json, text/plain, */*",
                "Accept-Encoding": "deflate, br",
                'Content-Type': 'application/json;charset=UTF-8',
                "Accept-Language": "es-ES,es;q=0.9,en-GB;q=0.8,en;q=0.7",
                'Connection': 'keep-alive',
                'referer': 'https://www.epicgames.com/store/es-ES/free-games'
                // "Cookie": "EPIC_SESSION_DIESEL=dPtyZcknUP-Qj-zxPvJ8FQ.Jst-P_sV9eEdhJwCjbHynDnJ3a21qC7WI4dTv_K0q0AVO5__kn_kWKFr2hcfeAwT.1587026982591.86400000.lZvA_r476jM0U1vhXtlD631rWYFv_HDuVDpzz9EsjdI; EPIC_LOCALE_COOKIE=es-ES; _epicSID=52fca825952248f48c5e6326af91bbb0; euCookieAccepted=true"
            }
        }).then((result) => {
            let current_titles = [];
            let future_titles = [];
            if (!result.body || !result.body.data || !result.body.data.Catalog || !result.body.data.Catalog.searchStore || !result.body.data.Catalog.searchStore.elements) return resolve({ current_titles, future_titles });
            let elements = result.body.data.Catalog.searchStore.elements;
            if (!elements.length) return resolve({ current_titles, future_titles });
            main_for: for (let e of elements) {
                if (!e.promotions) continue;
                let searching = [
                    // Current offers
                    e.promotions.promotionalOffers,
                    // Future offers
                    e.promotions.upcomingPromotionalOffers
                ];
                for (let s of searching) {
                    if (!s || !s.length) continue;
                    for (let p of s) {
                        if (!p.promotionalOffers || !p.promotionalOffers.length) continue;
                        for (let p2 of p.promotionalOffers) {
                            if (!p2.discountSetting || p2.discountSetting.discountPercentage !== 0) continue;

                            let obj = {
                                title: e.title,
                                images: e.keyImages,
                                startDate: new Date(p2.startDate),
                                endDate: new Date(p2.endDate),
                                url: 'https://www.epicgames.com/store/es-ES/product/' + e.productSlug
                            };
                            if (s === searching[0]) {
                                current_titles.push(obj);
                            } else if (s === searching[1]) {
                                future_titles.push(obj);
                            } else {
                                console.log("?", e.title);
                            }
                            continue main_for;
                        }
                    }
                }
            } // main_for
            return resolve({ current_titles, future_titles, error: null });
        }).catch((result) => {
            return reject(result.error || result.body || result);
        });
    });
}


async function waitAMoment(time) {
    time = time || time === 0 ? time : 1000;
    console.log("Waiting", time, '(' + (time / 1000) + 's)');
    return new Promise((resolve) => {
        setTimeout(resolve, time);
    });
}
module.exports = {
    searchFreeEpicGamesGames,
    waitAMoment,
    checkUser,
    updateUser,
    sendToUsers,
    checkCurrentTitles,
};
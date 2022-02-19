"use strict";
import { HTTPpetition, HTTPpetitionOLD } from './request_functions.js';

export function searchFreeEpicGamesGames() {


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

        HTTPpetitionOLD('post', {
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
        }, true).then((result) => {
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


export function searchFreeGogGamesGames() {

    let url = "https://www.gog.com";
    return new Promise((resolve, reject) => {
        HTTPpetition('get', { url: url }, true).then((result) => {
            let body = result.body;
            const searchText = "giveaway-banner-id";
            if (body.includes(searchText)) {
                let searchText2 = "ng-href=\"";
                let start = body.split(searchText)[0].lastIndexOf(searchText2);
                let end = body.indexOf("\"", start + searchText2.length);
                let gameUrl = url + body.substring(start + searchText2.length, end);

                let searchText3 = "giveaway-banner__title\">";
                let splitted = body.split(searchText3);
                let title = splitted[1].split("Claim ")[1].split(" as a token")[0];
                let obj = {
                    title: title,
                    images: [],
                    startDate: new Date(),
                    endDate: null,
                    url: gameUrl
                };
                return resolve({ current_titles: [obj], future_titles: [], error: null });
            } else {
                return resolve({ current_titles: [], future_titles: [], error: null });
            }
        }).catch((err) => {
            return reject(err);
        });
    });
}
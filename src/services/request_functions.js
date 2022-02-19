"use strict";

import request from 'request';
import got from "got";

/**
 * 
 * @param {get|post} type 
 * @param {import('request').Options} options 
 * @returns {Promise<{error,response,body}>}
 */
export function HTTPpetitionOLD(type, options, json = false) {
    return new Promise((resolve, reject) => {
        function result(error, response, body) {
            if (!error && response.statusCode === 200) {
                if (json) {
                    try {
                        let body_parsed = JSON.parse(body);
                        body = body_parsed;
                    } catch (_err) {
                        console.log("Error parsing body", _err);
                        // :D...
                    }
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



export function HTTPpetition(type, url, options) {
    return new Promise((resolve, reject) => {
        if (type == "post") {
            console.log("Doing post");
            got.post(url, options).then((response) => {
                if (response.body) {
                    resolve({ error: null, response, body: response.body });
                } else {
                    resolve({ error: "No body", response, body: null });
                }
            });
        } else {
            got.get(url, options).then((response) => {
                if (response.body) {
                    resolve({ error: null, response, body: response.body });
                } else {
                    resolve({ error: "No body", response, body: null });
                }
            });
        }
    });
}

"use strict";
import moment from 'moment';
import { Find, UpdateOne } from "./mongo/mongo.js";

export async function checkUser(msg) {
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


export function updateUser(id, type, value) {
    return UpdateOne('users', { id: id }, { $set: { ["subscribed." + type]: value } });
}


function getUser(id, project = {}) {
    return Find('users', { id: id }, project, {}, true);
}

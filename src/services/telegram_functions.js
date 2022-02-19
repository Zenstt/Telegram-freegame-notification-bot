"use strict";

import { getMesage } from "./general_functions.js";
import { UpdateOne, Find } from "./mongo/mongo.js";

export async function sendToUsers(bot, type, message = null, extra_data = null) {

    if (!type) {
        // Wa-?
        console.log("No hay type?");
        return;
    }
    console.log("Sending to", type, 'suscribed');

    // Get users with that subscription
    let users = await Find('users', { ["subscribed." + type]: true }, { id: 1, username: 1, first_name: 1 });

    // Iterate the users
    for (let user of users) {
        console.log("Sending message to user", user.username || user.first_name);
        let text = getMesage()[type](user, message, extra_data);
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



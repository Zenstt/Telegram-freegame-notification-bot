"use strict";
process.env.NTBA_FIX_319 = 1;

const TelegramBot = require('node-telegram-bot-api');
const moment = require('moment');
const { Connect, UpdateOne } = require('./modules/mongo/mongo');
const options = require('./modules/options/options');
const fs = require('fs');
const {
    searchFreeEpicGamesGames,
    waitAMoment,
    checkUser,
    updateUser,
    sendToUsers,
    checkCurrentTitles
} = require('./functions');
const cron = require('node-cron');

// Creamos un bot que usa 'polling'para obtener actualizaciones
const bot = new TelegramBot(options.token, { polling: true });
console.show = console.log;
console.log = (...params) => {
    console.show(moment().format('YYYY-MM-DD HH:mm:ss'), '|', ...params);
};
console.log("Bot Iniciado");

// const user_db_file = __dirname + '/users.db.json';
// const notification_file = __dirname + '/notifications.log';


// let users = {};
// try {
//     users = JSON.parse(fs.readFileSync(user_db_file));
// } catch (err) {
//     console.log(err);
//     fs.writeFileSync(user_db_file, "{}");
// }

Connect().then(() => {

    bot.on('message', async (msg) => {
        console.log('message: ', msg.from.username || msg.from.first_name, '=>', msg.text);
        const user = await checkUser(msg);
        // const user = users[msg.from.id];
        if (msg.text == "/menu" || msg.text == '/start') {
            let mes = getMainMessage(user);
            bot.sendMessage(msg.from.id, mes.text, mes.options);
        } else {
            bot.sendMessage(msg.from.id, "?");
        }
        return;
    });
    bot.on("callback_query", async function (msg) {
        console.log('callback_query: ', msg.from.username || msg.from.first_name, '=>', msg.data);
        const user = await checkUser(msg);
        // const user = users[msg.from.id];
        await updateUser(user.id, msg.data, !user.subscribed[msg.data] ? true : false);
        user.subscribed[msg.data] = !user.subscribed[msg.data] ? true : false;
        const new_mess = getMainMessage(user);
        // bot.editMessageText(new_mess.text, { message_id: msg.message.message_id, chat_id: msg.message.chat.id });
        bot.editMessageReplyMarkup(new_mess.options.reply_markup, { message_id: msg.message.message_id, chat_id: msg.message.chat.id });
        bot.answerCallbackQuery(msg.id, { text: "Changed" });
    });


    let crontabs = {
        // epic_games: new CronJob('0 07 09 * * 4', async () => {
        epic_games: cron.schedule('0 07 17 * * *', async () => {
        // epic_games: cron.schedule('0 07 17 * * 4', async () => {
            // epic_games: cron.schedule('0 29 11 * * *', async () => {
            console.log('Epic games crontab starting!');
            await epicGamesCron();
        }, {
            timezone: "Europe/Madrid"
        })
    };
    epicGamesCron();
}).catch((err) => {
    console.log('err', err);
});

async function epicGamesCron() {
    // Get the current free games
    let extra_data = await searchFreeEpicGamesGames().catch(console.log);
    // Check and Update the new titles available
    let new_titles = await checkCurrentTitles(extra_data.current_titles);
    console.log("New titles:", new_titles.length);
    // If there's a new title, send to user
    if (new_titles.length) {
        // sendToUsers(bot, 'epic_games', null, new_titles || null);
    }
}


function getMainMessage(user) {
    return {
        text: `
Hello ${user.username || user.first_name} this is @GNotificationsBot
Select an option bellow to enable or disable a notification     
`,
        options: {
            reply_markup: {
                inline_keyboard: [[{
                    text: 'Free Epic Games games: ' + (user.subscribed.epic_games ? 'Yes' : 'No'),
                    callback_data: 'epic_games'
                }]]
            }
        }
    };
}

// Saving user data...
// setInterval(saveUsers, 1000 * 60 * 10);
// setInterval(checkNotifications, 1000 * 60);
// checkNotifications();


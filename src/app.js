"use strict";
process.env.NTBA_FIX_319 = 1;

import TelegramBot from 'node-telegram-bot-api';
import moment from 'moment';
import nodecron from 'node-cron';
const { schedule } = nodecron;
import { token } from './options/options.js';
import { Connect } from './services/mongo/mongo.js';
import { checkUser, updateUser } from './services/users.js';
import { crontGames } from './jobs/crontab_functions.js';

// Creamos un bot que usa 'polling'para obtener actualizaciones
const bot = new TelegramBot(token, { polling: true });
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
        epic_games: schedule('0 05 * * * *', async () => {
            // epic_games: cron.schedule('0 07 17 * * 4', async () => {
            // epic_games: cron.schedule('0 29 11 * * *', async () => {
            console.log('Epic games crontab starting!');
            await crontGames(bot, 'epic_games');
        }, {
            timezone: "Europe/Madrid"
        }),
        gog_games: schedule('0 04 * * * *', async () => {
            // epic_games: cron.schedule('0 07 17 * * 4', async () => {
            // epic_games: cron.schedule('0 29 11 * * *', async () => {
            console.log('gog games starting!');
            await crontGames(bot, 'gog_games');
        }, {
            timezone: "Europe/Madrid"
        })
    };
    crontGames(bot, 'epic_games');
    crontGames(bot, 'gog_games');
}).catch((err) => {
    console.log('err', err);
});




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


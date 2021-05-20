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
    sendToUsers
} = require('./functions');
const { CronJob } = require('cron');

// Creamos un bot que usa 'polling'para obtener actualizaciones
const bot = new TelegramBot(options.token, { polling: true });
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
        epic_games: new CronJob('0 01 16 * * 4', async () => {
            console.log('Epic games crontab starting!');
            await epicGamesCron();
            console.log('Next epic games date will be: ', crontabs.epic_games.nextDate().format('YYYY-MM-DD HH:mm'));
        }, null, true)
    };
    console.log('Next epic games date will be: ', crontabs.epic_games.nextDate().format('YYYY-MM-DD HH:mm'));
});

async function epicGamesCron() {
    let extra_data = await searchFreeEpicGamesGames().catch(console.log);
    sendToUsers(bot, 'epic_games', null, extra_data || null);
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


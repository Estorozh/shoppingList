const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config()

const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

let shoppingList = [];
let selectedProducts = [];

const COMMANDS = {
    TOGGLE: 'toggle',
    DELETE_SELECTED: 'delete_selected',
    SHOW_LIST: 'Показать список',
    ADD_ITEMS: 'Добавить продукты',
    DELETE_ITEMS: 'Удалить продукты',
    CLEAR_LIST: 'Очистить список',
}

bot.onText(/\/start/, (msg) => {
    sendWelcomeMessage(msg.chat.id);
});

function sendWelcomeMessage(chatId) {
    const welcomeMessage = `
    Добро пожаловать! Я помогу вам с покупками.

    Выберите действие на клавиатуре:
    `;

    const options = {
        reply_markup: {
            keyboard: [
                [
                    { text: COMMANDS.SHOW_LIST },
                    { text: COMMANDS.ADD_ITEMS },
                ],
                [
                    { text: COMMANDS.DELETE_ITEMS },
                    { text: COMMANDS.CLEAR_LIST }
                ],
            ],
            resize_keyboard: true,
            one_time_keyboard: true
        }
    };

    bot.sendMessage(chatId, welcomeMessage, options);
}

bot.on('message', (msg) => {
    const chatId = msg.chat.id;

    if (msg.text === "Начать") {
        return sendWelcomeMessage(chatId);
    } 

    if (msg.text === COMMANDS.SHOW_LIST) {
        return bot.sendMessage(chatId, `Ваш список покупок:\n${shoppingList.length ? shoppingList.join('\n') : 'Список покупок пуст.'}`);
    }

    if (msg.text === COMMANDS.ADD_ITEMS) {
        return bot.sendMessage(chatId, 'Введите список продуктов через Enter:').then(() => {
            bot.once('message', (msg) => {
                const products = msg.text.split('\n').map(item => item.trim()).filter(item => item !== '');

                shoppingList.push(...products);

                bot.sendMessage(chatId, `Добавлены продукты:\n${products.join('\n')}`);
            });
        });
    } 

    if (msg.text === COMMANDS.DELETE_ITEMS) {
        return showDeleteOptions(chatId);
    } 

    if (msg.text === COMMANDS.CLEAR_LIST) {
        shoppingList = [];

        return bot.sendMessage(chatId, 'Список покупок очищен.');
    }
});

function getOptions() {
    return {
        reply_markup: {
            inline_keyboard: shoppingList.map((item, index) => [
                { text: `${selectedProducts.includes(index) ? '✔️' : ''} ${item}`, callback_data: `${COMMANDS.TOGGLE}_${index}` }
            ]).concat([[{ text: "Удалить выбранные", callback_data: COMMANDS.DELETE_SELECTED }]])
        }
    };
}

function showDeleteOptions(chatId) {
    if (!shoppingList.length) {
        bot.sendMessage(chatId, 'Список покупок пуст.');

        return;
    }

    const options = getOptions();


    bot.sendMessage(chatId, 'Выберите продукты для удаления:', options).then(sentMessage => {
        sentMessage.message_id = sentMessage.message_id;
    });
}

bot.on('callback_query', (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const action = callbackQuery.data;

    if (action.startsWith(COMMANDS.TOGGLE)) {
        const index = parseInt(action.split('_')[1]);

        if (selectedProducts.includes(index)) {
            selectedProducts = selectedProducts.filter(indexSelected => indexSelected !== index);
        } else {
            selectedProducts.push(index);
        }

        const options = getOptions()

        return bot.editMessageReplyMarkup(options.reply_markup, { chat_id: chatId, message_id: callbackQuery.message.message_id });
    }
    
    if (action === COMMANDS.DELETE_SELECTED && !selectedProducts.length) {
        return bot.sendMessage(chatId, 'Нет выбранных продуктов для удаления.');
    }

    const removedProducts = [];

    shoppingList = shoppingList.filter((item, index) => {
        if(selectedProducts.includes(index)) {
            removedProducts.push(item)

            return false
        }

        return true
    });

    bot.sendMessage(chatId, `Удалены продукты:\n${removedProducts.join('\n')}`);

    selectedProducts = [];
});
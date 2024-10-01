const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config()

const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

let shoppingList = [];

bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;

    const welcomeMessage = `
    Добро пожаловать! Я помогу вам с покупками.

    Вот список доступных команд:
        /show_list - Показать текущий список покупок
        /add - Добавить продукты в список
        /delete - Удалить продукты из списка
        /clear_list - Очистить список покупок

    Просто выберите нужную команду и следуйте инструкциям.
    `;

    bot.sendMessage(chatId, welcomeMessage);
});

bot.onText(/\/show_list/, (msg) => {
    const chatId = msg.chat.id;

    if (shoppingList.length === 0) {
        bot.sendMessage(chatId, 'Список покупок пуст.');
    } else {
        const list = [...shoppingList].map((item, index) => `${index+1} ${item}`).join('\n');
        bot.sendMessage(chatId, `Ваш список покупок:\n${list}`);
    }
});

bot.onText(/\/add/, (msg) => {
    const chatId = msg.chat.id;

    bot.sendMessage(chatId, 'Введите список продуктов через Enter:').then(() => {
        bot.once('message', (msg) => {
            const products = msg.text.split('\n').map(item => item.trim()).filter(item => item !== '');
            shoppingList.push(...products);
            bot.sendMessage(chatId, `Добавлены продукты:\n${products.join('\n')}`);
        });
    });
});

bot.onText(/\/delete/, (msg) => {
    const chatId = msg.chat.id;

    bot.sendMessage(chatId, `Введите номера продуктов для удаления через пробел:
        ${[...shoppingList].map((item, index) => `${index+1} ${item}`).join('\n')}`).then(() => {
        bot.once('message', (msg) => {
            const idsProductToRemove = msg.text.split(' ');

            const shouldDeleting = idsProductToRemove.map((id) => shoppingList[id - 1])

            shoppingList = shoppingList.filter((itemShoppingList) => {
                const hasProductToRemove = productsToRemove.find((itemToRemove) => itemShoppingList.includes(itemToRemove))

                return !hasProductToRemove
            });

            bot.sendMessage(chatId, `Удалены продукты:\n${shouldDeleting.join('\n')}`);
        });
    });
});

bot.onText(/\/clear_list/, (msg) => {
    const chatId = msg.chat.id;
    shoppingList = [];
    bot.sendMessage(chatId, 'Список покупок очищен.');
});

// bot.on('message', (msg) => {
//     const chatId = msg.chat.id;

//     // Игнорируем команды, остальные сообщения обрабатываются как непонятые
//     if (msg.text.startsWith('/')) {
//         bot.sendMessage(chatId, 'Неизвестная команда. Используйте /show_list, /add, /delete или /clear_list.');
//     }
// });

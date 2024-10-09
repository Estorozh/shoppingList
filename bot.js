const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config()

const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

let shoppingList = [];
let selectedProducts = []; // Глобальный массив для хранения выбранных продуктов

bot.onText(/\/start/, (msg) => {
    sendWelcomeMessage(msg.chat.id);
});

// Функция для отправки приветственного сообщения
function sendWelcomeMessage(chatId) {
    const welcomeMessage = `
    Добро пожаловать! Я помогу вам с покупками.

    Выберите действие на клавиатуре:
    `;

    const options = {
        reply_markup: {
            keyboard: [
                [
                    { text: "Показать список" },
                    { text: "Добавить продукты" }
                ],
                [
                    { text: "Удалить продукты" },
                    { text: "Очистить список" }
                ],
            ],
            resize_keyboard: true,
            one_time_keyboard: true
        }
    };

    bot.sendMessage(chatId, welcomeMessage, options);
}

// Обработка текстовых сообщений
bot.on('message', (msg) => {
    const chatId = msg.chat.id;

    if (msg.text === "Начать") {
        sendWelcomeMessage(chatId);
    } else if (msg.text === "Показать список") {
        bot.sendMessage(chatId, `Ваш список покупок:\n${shoppingList.length === 0 ? 'Список покупок пуст.' : shoppingList.join('\n')}`);
    } else if (msg.text === "Добавить продукты") {
        bot.sendMessage(chatId, 'Введите список продуктов через Enter:').then(() => {
            bot.once('message', (msg) => {
                const products = msg.text.split('\n').map(item => item.trim()).filter(item => item !== '');
                shoppingList.push(...products);
                bot.sendMessage(chatId, `Добавлены продукты:\n${products.join('\n')}`);
            });
        });
    } else if (msg.text === "Удалить продукты") {
        showDeleteOptions(chatId);
    } else if (msg.text === "Очистить список") {
        shoppingList = [];
        bot.sendMessage(chatId, 'Список покупок очищен.');
    }
});

// Функция для отображения продуктов для удаления
function showDeleteOptions(chatId) {
    if (shoppingList.length === 0) {
        bot.sendMessage(chatId, 'Список покупок пуст.');
        return;
    }

    const options = {
        reply_markup: {
            inline_keyboard: shoppingList.map((item, index) => [
                { text: `${selectedProducts.includes(index) ? '✔️' : ''} ${item}`, callback_data: `toggle_${index}` }
            ]).concat([[{ text: "Удалить выбранные", callback_data: "delete_selected" }]])
        }
    };

    bot.sendMessage(chatId, 'Выберите продукты для удаления:', options).then(sentMessage => {
        // Сохраняем ID сообщения для редактирования
        sentMessage.message_id = sentMessage.message_id;
    });
}

// Обработка нажатий на кнопки удаления
bot.on('callback_query', (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const action = callbackQuery.data;

    if (action.startsWith('toggle_')) {
        const index = parseInt(action.split('_')[1]);
        if (selectedProducts.includes(index)) {
            selectedProducts = selectedProducts.filter(i => i !== index); // Удаляем из выбранных
        } else {
            selectedProducts.push(index); // Добавляем в выбранные
        }

        // Обновляем разметку кнопок в том же сообщении
        const options = {
            reply_markup: {
                inline_keyboard: shoppingList.map((item, idx) => [
                    { text: `${selectedProducts.includes(idx) ? '✔️' : ''} ${item}`, callback_data: `toggle_${idx}` }
                ]).concat([[{ text: "Удалить выбранные", callback_data: "delete_selected" }]])
            }
        };

        bot.editMessageReplyMarkup(options.reply_markup, { chat_id: chatId, message_id: callbackQuery.message.message_id });
    } else if (action === 'delete_selected') {
        if (selectedProducts.length > 0) {
            const removedProducts = selectedProducts.map(index => shoppingList[index]);
            shoppingList = shoppingList.filter((_, index) => !selectedProducts.includes(index)); // Удаляем выбранные продукты
            bot.sendMessage(chatId, `Удалены продукты:\n${removedProducts.join('\n')}`);
            selectedProducts = []; // Очищаем выбранные
        } else {
            bot.sendMessage(chatId, 'Нет выбранных продуктов для удаления.');
        }
        // showDeleteOptions(chatId); // Показываем обновленный список
    }
});
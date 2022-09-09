require ('dotenv').config(); // create .env file and add your TOKEN, SERVER_URL, AUTH_KEY  
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const qs = require('qs');

const {TOKEN, SERVER_URL, AUTH_KEY} = process.env; //need to get bot TOKEN from telegram @botFather, SERVER_URL from heroku('https://yourAppName.herokuapp.com), AUTH_KEY from translator app  
const TELEGRAM_API = `https://api.telegram.org/bot${TOKEN}`;
const URI = `/webhook/${TOKEN}`;
const WEBHOOK_URL = SERVER_URL + URI;

const app = express();
app.use(bodyParser.json());

const init = async () =>{
    try {
    const res = await axios.get(`${TELEGRAM_API}/setWebhook?url=${WEBHOOK_URL}`);
    console.log(res.data);
    }
    catch (error)
    {
        console.log(error);
    }
}
app.post(URI, async (req, res) => {
    try {
        const bodyReq = req.body; 
        console.log(bodyReq);
            if('channel_post' in bodyReq) // if bot is on channel it will translate administrators posts
            {
                const text = bodyReq.channel_post.text;
                const chatId = bodyReq.channel_post.chat.id;
                if (typeof(text) !== 'undefined') {
                    axios.post(`https://api-free.deepl.com/v2/translate`,
                    qs.stringify({'auth_key': AUTH_KEY, 'text': text, 'target_lang':'UK'}))
                    .then(function (response) {
                        const arr = response.data.translations;
                        const translatedWord = arr.map(a => a.text)[0]; 
                        axios.post(`${TELEGRAM_API}/sendMessage`, {
                            chat_id: chatId,
                            text: translatedWord
                        });
                });
                } else if (typeof(bodyReq.channel_post.sticker) !== "undefined"){
                    axios.post(`${TELEGRAM_API}/sendSticker`, {
                        chat_id: chatId,
                        sticker: bodyReq.channel_post.sticker.file_id
                    });
                } 
            }
            else if("message" in bodyReq)
            {
                const text = bodyReq.message.text; 
                const chatId = bodyReq.message.chat.id 
                if (typeof(text) !== 'undefined') 
                {
                    axios.post(`https://api-free.deepl.com/v2/translate`, 
                    qs.stringify({'auth_key': AUTH_KEY, 'text': text, 'target_lang':'UK'}))
                    .then(function (response) {
                    const arr = response.data.translations;
                    const translatedWord = arr.map(a => a.text)[0];
                        axios.post(`${TELEGRAM_API}/sendMessage`, {
                            chat_id: chatId,
                            text: translatedWord
                        });
                    });    
                } 
                else if (typeof(bodyReq.message.sticker) !== "undefined"){
                    axios.post(`${TELEGRAM_API}/sendSticker`, {
                        chat_id: chatId,
                        sticker: bodyReq.message.sticker.file_id
                    });
                }
            }     
    return res.send();
    }
    catch (error) {
        console.log(error);
    }
});

app.listen(process.env.PORT || 8080, async () => {
    console.log("App run on port", process.env.PORT || 8080);
    await init();
});
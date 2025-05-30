// server.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Configuration, OpenAIApi } = require('openai');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 10000;

// Middlewares
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// OpenAIの初期化
const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY
});
const openai = new OpenAIApi(configuration);

// AI添削エンドポイント
app.post('/tensaku', async (req, res) => {
    const { text, maxLen } = req.body;
    try {
        // ChatGPT（gpt-3.5-turbo）に指示
        const completion = await openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: "あなたは日本語の文章添削アドバイザーです。与えられた文を高卒求人票用に分かりやすく300文字以内で自然な日本語に添削し、必要があれば短いアドバイスも付けてください。" },
                { role: "user", content: text }
            ],
            max_tokens: 512,
            temperature: 0.6
        });

        // ChatGPTからの出力テキストをパース
        let result = completion.data.choices[0].message.content || "";
        let advice = "";
        // "【アドバイス】"などで分割
        if (result.includes("【アドバイス】")) {
            [result, advice] = result.split("【アドバイス】");
            advice = advice.trim();
        }
        result = result.trim();

        res.json({
            result,
            advice: advice || "なし",
            length: result.length
        });
    } catch (err) {
        res.status(500).json({ result: '', advice: 'エラー', length: 0, error: err.message });
    }
});

// サーバー起動
app.listen(port, () => {
    console.log(`AI添削サーバー起動: http://localhost:${port}/`);
});

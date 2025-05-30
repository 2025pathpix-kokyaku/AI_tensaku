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
app.use(express.static('public')); // index.html等をpublicフォルダに

// OpenAI初期化
const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY
});
const openai = new OpenAIApi(configuration);

// AI添削エンドポイント
app.post('/tensaku', async (req, res) => {
    const { text, maxLen } = req.body;
    try {
        // 強化プロンプト（高卒求人票らしさを絶対反映！）
        const completion = await openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: `
あなたは日本語の高卒求人票作成アドバイザーです。与えられた文を、実際の高卒求人票に最適な形で${maxLen}文字以内で分かりやすく、必ず以下の点を反映して添削してください。
・未経験者でも安心して応募できる雰囲気（丁寧な指導、先輩のサポート、チームでの協力など）
・福利厚生や働きやすさ、育成制度、キャリアパスなども必ず触れる
・高校生や保護者が安心する要素を盛り込む
・仕事内容はなるべく具体的にイメージできる表現に
添削後、必要があれば短いアドバイスも【アドバイス】の見出しで分けて記載してください。なければ「アドバイス：なし」と記載。
                    `
                },
                { role: "user", content: text }
            ],
            max_tokens: 512,
            temperature: 0.6
        });

        // ChatGPT出力のパース
        let result = completion.data.choices[0].message.content || "";
        let advice = "";
        if (result.includes("【アドバイス】")) {
            [result, advice] = result.split("【アドバイス】");
            advice = advice.trim();
        }
        result = result.trim();

        // 余分なヘッダーなど除去
        result = result.replace(/^【AI添削結果】/, '').trim();
        advice = advice.replace(/^アドバイス[:：]?/, '').trim();

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

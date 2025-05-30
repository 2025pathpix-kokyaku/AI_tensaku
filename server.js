// 1. .envからAPIキーを取得
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

// 2. OpenAIパッケージ（最新API v4系対応）
const { OpenAI } = require('openai');

// 3. 環境変数からAPIキー
const apiKey = process.env.OPENAI_API_KEY;

// 4. インスタンス生成
const openai = new OpenAI({ apiKey });

const app = express();
app.use(cors());
app.use(bodyParser.json());

// 5. API POST受信
app.post('/tensaku', async (req, res) => {
    const { text } = req.body;

    // 入力チェック
    if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: "文章(text)を正しく送信してください。" });
    }

    try {
        // ChatGPTへプロンプト送信
        const chatCompletion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",  // GPT-4を利用する場合は "gpt-4" 等に
            messages: [
                {
                    role: "system",
                    content: "あなたは高校新卒採用求人票の専門コンサルタントです。以下の求人票文を、高校生・保護者に伝わる具体的な表現に添削してください。加えて「どこが曖昧か」「何を明記すると良いか」も簡潔にアドバイスしなさい。"
                },
                {
                    role: "user",
                    content: text
                }
            ],
            max_tokens: 512,
            temperature: 0.2
        });

        // 結果返却
        const result = chatCompletion.choices[0].message.content;
        res.json({ result });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "AI連携エラー: " + err.message });
    }
});

// 6. サーバ起動

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`AI添削サーバー 起動中 : http://localhost:${PORT}/`);
});
const path = require('path');
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});



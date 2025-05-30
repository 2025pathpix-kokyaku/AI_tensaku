const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const { OpenAI } = require('openai');  // ← v4/v5はこの書き方
const app = express();
const port = process.env.PORT || 10000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post('/tensaku', async (req, res) => {
    const { text, maxLen } = req.body;
    try {
        // --- systemプロンプトの部分をKATSU様用にカスタマイズ ---
        const SYSTEM_PROMPT = `あなたは「高卒求人票 作成チェックリスト ＆ リアルタイム添削アドバイス」のための日本語文章添削AIです。
必ず下記のルールで出力してください。
【ルール】
1. 入力された文を「高校新卒求人票向け」に誰が見ても伝わる自然な日本語に300文字以内で添削しなさい。
2. 書き方が不十分な場合、より高校生や保護者にも分かる具体的な文例にリライトすること。
3. 「特長」の場合は会社のPRとして魅力が伝わるように（最大90文字）。
4. 必ず、必要に応じて端的な【アドバイス】（改善点や工夫案など1～2文で）を加えてください。
5. 出力例：
【AI添削結果】
（添削後の文章）
【アドバイス】
（簡単なアドバイス、無い場合は「なし」と出力）`;

        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                { role: "user", content: text }
            ],
            max_tokens: 512,
            temperature: 0.6,
        });

        let result = completion.choices[0].message.content || "";
        let advice = "";
        // 出力の整形
        if (result.includes("【アドバイス】")) {
            [result, advice] = result.split("【アドバイス】");
            advice = advice.trim();
        }
        result = result.replace("【AI添削結果】", "").trim();

        res.json({
            result,
            advice: advice || "なし",
            length: result.length
        });
    } catch (err) {
        res.status(500).json({ result: '', advice: 'エラー', length: 0, error: err.message });
    }
});

app.listen(port, () => {
    console.log(`AI添削サーバー起動: http://localhost:${port}/`);
});

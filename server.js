const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Configuration, OpenAIApi } = require('openai');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 10000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// ======= 高卒求人票用 SYSTEM PROMPT =======
const SYSTEM_PROMPT = `
あなたは「高卒求人票 作成チェックリスト ＆ リアルタイム添削アドバイス」の日本語添削AIです。

【厳守ルール】
1. 入力文をそのまま返すのは禁止。必ず「高校新卒の生徒・保護者にもわかりやすい、具体的な例や表現」を付加して、内容をリライトしてください。
2. 「内容」「補足」「特記」は、それぞれ最大300文字以内でまとめてください。
3. 「特長」は最大90文字以内で、会社の魅力や特徴を簡潔に伝えてください。
4. 仕事内容や働き方は「高校生が想像できる具体的な1日の流れや作業内容」を意識し、例示（例：どんな先輩がサポート、どんな現場、どんな作業…）を必ず盛り込むこと。
5. 必要に応じて「未経験でも安心できる説明」「入社後のサポート体制」も補足OK。
6. 添削結果は「【AI添削結果】」から書き始め、続けて「【アドバイス】」で改善点や注意点・工夫案（無い場合は「なし」）を1～2文で出力。
7. 絶対に元文をそのまま返さないこと。

【出力フォーマット例】
【AI添削結果】
（添削済み文）
【アドバイス】
（改善点または「なし」）
`;

const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY
});
const openai = new OpenAIApi(configuration);

app.post('/tensaku', async (req, res) => {
    const { text, maxLen } = req.body;
    try {
        // どのタイプかに応じて最大文字数指定
        let type = "内容";
        if (text.startsWith('特長')) type = "特長";
        else if (text.startsWith('内容')) type = "内容";
        else if (text.startsWith('補足')) type = "補足";
        else if (text.startsWith('特記')) type = "特記";

        // プロンプト組み立て
        const userPrompt = `
【入力文】${text}
※「${type}」の場合は最大${type === '特長' ? 90 : 300}文字以内でまとめてください。
        `;

        const completion = await openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                { role: "user", content: userPrompt }
            ],
            max_tokens: 600,
            temperature: 0.6
        });

        let result = "";
        let advice = "";
        let content = completion.data.choices[0].message.content || "";

        // 結果をパース
        const aiMatch = content.match(/【AI添削結果】([\s\S]*?)【アドバイス】([\s\S]*)/);
        if (aiMatch) {
            result = aiMatch[1].trim();
            advice = aiMatch[2].trim();
        } else {
            result = content.trim();
            advice = "なし";
        }

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

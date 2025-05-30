const express = require('express');
const bodyParser = require('body-parser');
const { Configuration, OpenAIApi } = require('openai');

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(express.static(__dirname));

// 必ずご自身のAPIキーをセット（Render環境変数OK）
const apiKey = process.env.OPENAI_API_KEY || 'YOUR_OPENAI_API_KEY';
const configuration = new Configuration({ apiKey });
const openai = new OpenAIApi(configuration);

app.post('/tensaku', async (req, res) => {
    try {
        const { text, maxLen } = req.body;
        let type = "内容";
        if (text.startsWith('特長')) type = "特長";
        if (text.startsWith('補足')) type = "補足";
        if (text.startsWith('特記')) type = "特記";

        // ---- PROMPTここから ----
        let PROMPT = `
あなたは未経験高校生向け求人票添削AIです。
【ルール】
- 全て未経験者前提。分かりやすさ・安心感・成長イメージ重視。
- 入力が短い場合（「内容」「補足」「特記」100字未満）は「仕事内容＋福利厚生＋休日・給与＋やりがい＋サポート体制」も加筆し、自然に200字程度へ
- 150字未満なら250字程度まで自然に加筆
- 150字以上なら添削のみ（過度な加筆禁止）
- 「特長」は90字以内厳守
- 無理な水増しや不自然な長文化は禁止。伝えるべき情報だけ
- 出力1：添削本文（本文のみ返す）
- 出力2：もし不足（例:福利厚生等なければ）だけ短くアドバイス

【企業原文】
${text}
---
【AI添削結果】
`;

        // ---- PROMPTここまで ----

        // OpenAIリクエスト
        const response = await openai.createChatCompletion({
            model: "gpt-4o",  // gpt-4o/gpt-4-turbo/など
            messages: [
                { role: "system", content: "あなたは高校新卒求人票のプロ添削AIです。" },
                { role: "user", content: PROMPT }
            ],
            max_tokens: 800,
            temperature: 0.3,
        });

        let result = response.data.choices[0].message.content.trim();

        // index.htmlのjs側でカウント用改行・空白除去
        res.json({ result });
    } catch (e) {
        res.status(500).json({ result: "AIエラー：" + e.message });
    }
});

app.listen(port, () => {
    console.log(`AI添削サーバー起動中: http://localhost:${port}/`);
});

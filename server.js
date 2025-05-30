// server.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const { OpenAI } = require('openai');

const app = express();
const port = process.env.PORT || 10000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// OpenAI初期化
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// AI添削エンドポイント
app.post('/tensaku', async (req, res) => {
  const { text, maxLen } = req.body;

  // 厳守ルール・プロンプト組込
  const systemPrompt = `
あなたは「高卒求人票のAI添削アドバイザー」です。以下の【厳守ルール】に必ず従い、指示通りに添削してください。

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

■「特長」の場合は90文字以内、「内容」「補足」「特記」は300文字以内を必ず厳守し、自然な日本語で分かりやすく端的にまとめてください。
`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // GPT-4のみ
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: text }
      ],
      max_tokens: 512,
      temperature: 0.6
    });

    let response = completion.choices[0]?.message?.content || "";
    let result = "", advice = "";

    // "【AI添削結果】"と"【アドバイス】"で切り出し
    const aiMatch = response.match(/【AI添削結果】([\s\S]*?)【アドバイス】([\s\S]*)/);
    if (aiMatch) {
      result = aiMatch[1].trim();
      advice = aiMatch[2].trim();
    } else {
      // フォーマット崩れ時の緊急措置
      result = response.trim();
      advice = "なし";
    }

    res.json({
      result,
      advice,
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

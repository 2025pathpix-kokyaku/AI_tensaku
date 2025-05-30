const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Configuration, OpenAIApi } = require('openai');

const app = express();
const port = process.env.PORT || 10000; // Render用に10000対応
app.use(cors());
app.use(bodyParser.json());

// OpenAI設定（APIキーはRenderの環境変数OPENAI_API_KEYで設定）
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// プロンプト生成関数
function buildPrompt(userText, maxLen, type) {
  if(type === "特長") {
    return `
あなたは高校生向け求人票の添削AIです。
「特長」ラベルで与えられた文は、90文字以内に自然な日本語で添削してください。
出力は必ず下記形式で：
【添削本文】
（ここに添削結果のみ90字以内で）
【アドバイス】
（必要な場合は90字以内で簡潔に。なければ「なし」）

---
${userText}
---`;
  } else {
    // 内容・補足・特記
    return `
あなたは未経験高校生向け求人票添削AIです。
下記要件で自然な求人票文に添削し、アドバイスも必ず返してください。
・入力が100字未満なら仕事内容＋福利厚生＋休日・給与＋やりがい＋サポート体制を自然に加筆し200字程度に。
・150字未満なら250字程度まで自然に加筆
・150字以上なら添削のみで良い
・全て未経験者前提。分かりやすさ・安心感・成長イメージを重視
・出力1：添削本文（改行のみで構成）
・出力2：不足観点（例：福利厚生未記載など）があれば短くアドバイスも返す

【添削本文】
（ここに添削後本文のみ）
【アドバイス】
（アドバイス必要な場合のみ簡潔に。なければ「なし」）

---
${userText}
---`;
  }
}

app.post('/tensaku', async (req, res) => {
  try {
    const { text, maxLen } = req.body;
    let type = "内容";
    if(text.startsWith("特長")) type = "特長";
    else if(text.startsWith("補足")) type = "補足";
    else if(text.startsWith("特記")) type = "特記";
    // プロンプト生成
    const prompt = buildPrompt(text, maxLen, type);

    // OpenAIリクエスト
    const completion = await openai.createChatCompletion({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 800,
      temperature: 0.3,
    });
    const aiText = completion.data.choices[0].message.content;

    // 添削本文・アドバイス分割
    const mainMatch = aiText.match(/【添削本文】([\s\S]*?)【アドバイス】([\s\S]*)/);
    let result = "";
    let advice = "";
    if(mainMatch){
      result = mainMatch[1].trim().replace(/^(\r?\n)+/g, "");
      advice = mainMatch[2].trim();
    } else {
      result = aiText.trim();
      advice = "";
    }
    // 添削本文のみカウント（スペース除外）
    const length = result.replace(/\s/g, '').length;

    res.json({ result, advice, length });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.use(express.static('public')); // public/配下でindex.htmlなど配信

app.listen(port, () => {
  console.log(`AI添削サーバー起動中 : http://localhost:${port}/`);
});

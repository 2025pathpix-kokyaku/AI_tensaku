function doAITensaku() {
    const input = document.getElementById('userBefore').value.trim();
    const aiOut = document.getElementById('aiAfter');
    const adviceOut = document.getElementById('advice-box');
    const loading = document.getElementById('loading');
    aiOut.style.display = "none";
    adviceOut.style.display = "none";
    aiOut.innerText = "";
    adviceOut.innerText = "";
    document.getElementById('char-count').innerText = "";
    if (!input) { adviceOut.style.display = "block"; adviceOut.innerHTML = "<b>【アドバイス】</b><br>（ここにAIのアドバイスが表示されます）"; return; }
    loading.style.display = "flex";
    let maxLen = 300, type = "内容";
    if (input.startsWith('特長')) { maxLen = 90; type = "特長"; }
    else if (input.startsWith('内容')) { maxLen = 300; type = "内容"; }
    else if (input.startsWith('補足')) { maxLen = 300; type = "補足"; }
    else if (input.startsWith('特記')) { maxLen = 300; type = "特記"; }
    fetch('/tensaku', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: input, maxLen: maxLen })
    })
    .then(response => response.json())
    .then(data => {
        loading.style.display = "none";
        aiOut.innerHTML = `<b>【AI添削結果】</b><br>${(data.result || '（添削結果なし）').replace(/\n/g, '<br>')}`;
        aiOut.style.display = "block";
        document.getElementById('char-count').innerHTML =
            `<b>（${type}）</b>　AI添削後：<b>${data.length}</b>文字 ／ 最大${maxLen}文字`;
        adviceOut.innerHTML = `<b>【アドバイス】</b><br>${(data.advice || 'なし').replace(/\n/g, '<br>')}`;
        adviceOut.style.display = "block";
    })
    .catch(e => {
        loading.style.display = "none";
        aiOut.innerHTML = `<span style="color:#c33">AI連携エラー: ${e.message}</span>`;
        aiOut.style.display = "block";
        adviceOut.innerHTML = "<b>【アドバイス】</b><br>エラーのためアドバイスは取得できませんでした";
        adviceOut.style.display = "block";
    });
}

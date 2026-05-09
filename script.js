let currentLanguage = "ja";
let currentSlot = 1;

// 保存対象
const SETTINGS_KEYS = [
    "min", "max", "decimalMode", "precision", "amount", "randomAmountMode", 
    "amountMin", "amountMax", "step", "exclude", "prefix", "suffix", 
    "logMode", "zeroPadding", "sortMode", "groupDuplicates", "unique"
];
for (let i = 0; i < 10; i++) {
    SETTINGS_KEYS.push(`hName_${i}`, `hMin_${i}`, `hMax_${i}`, `hPre_${i}`, `hSuf_${i}`, `hCol_${i}`);
}

const translations = {
    en: {
        subtitle: "Professional RNG Machine", settings: "Generator Settings", minimum: "Min", maximum: "Max",
        decimalMode: "Decimals", precision: "Places", amount: "Amount", randomAmount: "Random Amount",
        amountMin: "Amount Min", amountMax: "Amount Max", unique: "Unique Only", groupDuplicates: "Group Dups",
        sortMode: "Sort Mode", generate: "Forge Numbers", results: "Results", saveBtn: "Save", loadBtn: "Load",
        advancedSettings: "Advanced Settings", highlightRules: "Highlight Rules (Max 10)",
        capacityError: "Error: Range too small.", howToUse: "How to Use RNG Generator",
        guide1Title: "Range", guide1Desc: "Set min/max/amount. Big numbers OK.",
        guide2Title: "Advanced", guide2Desc: "Adjust Unique, Log, and CSV exclusion.",
        guide3Title: "Preset", guide3Desc: "Alias settings and save to 10 slots.",
        guide4Title: "Export", guide4Desc: "Download TXT/CSV with auto statistics.",
        generated: "Count", sum: "Sum", average: "Avg", min: "Min", max: "Max", ruleStats: "Rule Distribution"
    },
    ja: {
        subtitle: "プロ仕様RNGツール", settings: "生成設定", minimum: "最小値", maximum: "最大値",
        decimalMode: "小数を生成", precision: "小数桁数", amount: "個数", randomAmount: "個数をランダム化",
        amountMin: "最小個数", amountMax: "最大個数", unique: "重複なし", groupDuplicates: "重複をまとめる",
        sortMode: "並び順", generate: "数値を生成", results: "結果表示", saveBtn: "保存", loadBtn: "読み込み",
        advancedSettings: "高度な設定", highlightRules: "ハイライトルール (最大10)",
        capacityError: "エラー: 範囲が不足しています。", howToUse: "RNGジェネレーターの使い方",
        guide1Title: "基本設定", guide1Desc: "最小・最大・個数を設定。巨大な数値も入力可能です。",
        guide2Title: "詳細機能", guide2Desc: "重複排除、対数重み、除外リストが設定できます。",
        guide3Title: "プリセット", guide3Desc: "設定に名前をつけて10個のスロットに保存できます。",
        guide4Title: "書き出し", guide4Desc: "TXT/CSV形式で統計情報と共に保存可能です。",
        generated: "生成数", sum: "合計", average: "平均値", min: "最小", max: "最大", ruleStats: "ルール適用統計"
    }
};

let slotNames = JSON.parse(localStorage.getItem("rng_names") || "{}");
let lastGeneratedData = []; 

// UI制御: 小数
function toggleDecimalOptions() {
    document.getElementById("precisionGroup").style.display = document.getElementById("decimalMode").checked ? "block" : "none";
}

// UI制御: 個数ランダム化
function toggleAmountOptions() {
    const isRandom = document.getElementById("randomAmountMode").checked;
    document.getElementById("randomAmountInputs").style.display = isRandom ? "block" : "none";
    document.getElementById("amount").disabled = isRandom;
    document.getElementById("amount").style.opacity = isRandom ? "0.5" : "1";
}

function setLanguage(l) {
    currentLanguage = l;
    const t = translations[l];
    document.querySelectorAll("[data-lang]").forEach(el => {
        const key = el.dataset.lang;
        if (t[key]) el.textContent = t[key];
    });
}

function initHighlightInputs() {
    const c = document.getElementById("highlightRulesContainer");
    let h = "";
    for (let i = 0; i < 10; i++) {
        h += `<div class="rule-row">
            <span class="rule-num">${i + 1}</span>
            <input type="text" id="hName_${i}" placeholder="Name">
            <input type="number" id="hMin_${i}" placeholder="Min">
            <input type="number" id="hMax_${i}" placeholder="Max">
            <input type="text" id="hPre_${i}" placeholder="Pre">
            <input type="text" id="hSuf_${i}" placeholder="Suf">
            <input type="color" id="hCol_${i}" value="#7aa2ff">
        </div>`;
    }
    c.innerHTML = h;
}

function initSlots() {
    const c = document.getElementById('slotContainer');
    c.innerHTML = "";
    for (let i = 1; i <= 10; i++) {
        const b = document.createElement('button');
        b.className = `slot-btn ${i === currentSlot ? 'active' : ''}`;
        b.onclick = () => {
            currentSlot = i;
            initSlots();
            document.getElementById('slotName').value = slotNames[i] || "";
        };
        b.innerHTML = `<div>${i}</div><div class="slot-alias">${slotNames[i] || ""}</div>`;
        c.appendChild(b);
    }
}

function saveSettings() {
    const s = {};
    SETTINGS_KEYS.forEach(k => {
        const e = document.getElementById(k);
        if (e) s[k] = e.type === "checkbox" ? e.checked : e.value;
    });
    slotNames[currentSlot] = document.getElementById('slotName').value;
    localStorage.setItem("rng_names", JSON.stringify(slotNames));
    localStorage.setItem(`rng_slot_${currentSlot}`, JSON.stringify(s));
    initSlots();
}

function loadSettings() {
    const d = localStorage.getItem(`rng_slot_${currentSlot}`);
    if (!d) return;
    const s = JSON.parse(d);
    SETTINGS_KEYS.forEach(k => {
        const e = document.getElementById(k);
        if (e && s[k] !== undefined) {
            if (e.type === "checkbox") e.checked = s[k];
            else e.value = s[k];
        }
    });
    toggleDecimalOptions();
    toggleAmountOptions();
}

// 数値生成
function getWeightedRandom(min, max, step, prec, useLog) {
    if (!useLog) {
        const range = Math.floor((max - min) / step);
        return parseFloat((min + (Math.floor(Math.random() * (range + 1)) * step)).toFixed(prec));
    }
    const logMin = Math.log(min <= 0 ? 0.000000001 : min);
    const logMax = Math.log(max <= 0 ? 1 : max);
    const logVal = Math.exp(logMin + Math.random() * (logMax - logMin));
    return parseFloat((Math.round((logVal - min) / step) * step + min).toFixed(prec));
}

function generate() {
    const resDiv = document.getElementById("result");
    const min = Number(document.getElementById("min").value);
    const max = Number(document.getElementById("max").value);
    const isUnique = document.getElementById("unique").checked;
    const step = Number(document.getElementById("step").value) || 1;
    const isDec = document.getElementById("decimalMode").checked;
    const prec = isDec ? Number(document.getElementById("precision").value) : 0;
    const isLog = document.getElementById("logMode").checked;
    const exclSet = new Set((document.getElementById("exclude").value || "").split(',').map(n => n.trim()).filter(n => n !== "").map(Number));

    // 生成個数
    let amt;
    if (document.getElementById("randomAmountMode").checked) {
        const aMin = Number(document.getElementById("amountMin").value);
        const aMax = Number(document.getElementById("amountMax").value);
        amt = Math.floor(Math.random() * (aMax - aMin + 1)) + aMin;
    } else {
        amt = Number(document.getElementById("amount").value);
    }

    // 重複なし時のcap
    const possibleCount = Math.floor((max - min) / step) + 1;
    if (isUnique && amt > (possibleCount - [...exclSet].filter(n => n >= min && n <= max).length)) {
        resDiv.innerHTML = `<div class="error">${translations[currentLanguage].capacityError}</div>`;
        return;
    }

    let results = [];
    let safeIdx = 0;
    while (results.length < amt && safeIdx < 200000) {
        let v = getWeightedRandom(min, max, step, prec, isLog);
        if (!exclSet.has(v) && (!isUnique || !results.includes(v))) {
            results.push(v);
        }
        safeIdx++;
    }

    if (results.length === 0) return;
    lastGeneratedData = [...results];

    const actualMin = Math.min(...results);
    const actualMax = Math.max(...results);
    const sort = document.getElementById("sortMode").value;
    if (sort === "asc") results.sort((a, b) => a - b);
    else if (sort === "desc") results.sort((a, b) => b - a);

    // ハイライトルールの取得
    const hRules = [];
    for (let i = 0; i < 10; i++) {
        const hMin = document.getElementById(`hMin_${i}`).value;
        const hMax = document.getElementById(`hMax_${i}`).value;
        if (hMin !== "" || hMax !== "") {
            hRules.push({
                name: document.getElementById(`hName_${i}`).value || `Rule ${i + 1}`,
                min: hMin === "" ? -Infinity : Number(hMin),
                max: hMax === "" ? Infinity : Number(hMax),
                pre: document.getElementById(`hPre_${i}`).value,
                suf: document.getElementById(`hSuf_${i}`).value,
                col: document.getElementById(`hCol_${i}`).value,
                count: 0
            });
        }
    }

    const pad = document.getElementById("zeroPadding").checked ? Math.max(Math.floor(min).toString().length, Math.floor(max).toString().length) : 0;
    const group = document.getElementById("groupDuplicates").checked;

    const tagData = results.map(v => {
        let p = document.getElementById("prefix").value, s = document.getElementById("suffix").value, st = "", cls = ["tag"];
        if (v === actualMin) cls.push("min-tag");
        if (v === actualMax) cls.push("max-tag");
        for (let r of hRules) {
            if (v >= r.min && v <= r.max) {
                r.count++; p = r.pre + p; s = s + r.suf;
                const rgb = parseInt(r.col.slice(1, 3), 16) + "," + parseInt(r.col.slice(3, 5), 16) + "," + parseInt(r.col.slice(5, 7), 16);
                st = `--h-col:${r.col};--h-bg:rgba(${rgb},0.15);--h-glow:rgba(${rgb},0.3);`;
                cls.push("custom-highlight");
                break;
            }
        }
        return { v, p, s, st, cls };
    });

    let displayItems = group ? Object.values(tagData.reduce((acc, d) => {
        const key = d.v;
        if (!acc[key]) acc[key] = { ...d, count: 0 };
        acc[key].count++;
        return acc;
    }, {})) : tagData.map(d => ({ ...d, count: 1 }));

    const tagsHtml = displayItems.map(i => `<span class="${i.cls.join(' ')}" style="${i.st}">${i.p}${isDec ? i.v.toFixed(prec) : i.v.toString().padStart(pad, '0')}${i.s}${i.count > 1 ? ' (x' + i.count + ')' : ''}</span>`).join('');

    const t = translations[currentLanguage];
    let statsHtml = `<div class="stats">
        <div><strong>${t.generated}</strong>${results.length}</div>
        <div><strong>${t.sum}</strong>${results.reduce((a, b) => a + b, 0).toLocaleString()}</div>
        <div><strong>${t.average}</strong>${(results.reduce((a, b) => a + b, 0) / results.length || 0).toFixed(prec)}</div>
        <div><strong>${t.min}</strong>${actualMin}</div>
        <div><strong>${t.max}</strong>${actualMax}</div>
    </div>`;

    if (hRules.length > 0) {
        statsHtml += `<div class="rule-stats-box"><div class="stats-label">${t.ruleStats}</div><div class="rule-stats-grid">` +
            hRules.filter(r => r.count > 0).map(r => `<div class="rule-stat-item" style="--line-col: ${r.col}"><span>${r.name}</span><strong>${r.count}</strong></div>`).join('') + `</div></div>`;
    }

    resDiv.innerHTML = statsHtml + `<div class="result-tags">${tagsHtml}</div>`;
}

// 書き出し機能
function downloadResults(type) {
    if (lastGeneratedData.length === 0) return;
    const content = type === 'csv' ? lastGeneratedData.join(',') : lastGeneratedData.join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rng_results_${new Date().getTime()}.${type}`;
    a.click();
    URL.revokeObjectURL(url);
}

window.onload = () => {
    initHighlightInputs();
    initSlots();
    setLanguage('ja');
};

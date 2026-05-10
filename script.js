let currentLanguage = "ja";
let currentSlot = 1;
let lastGeneratedData = [];
let lastUsedRules = [];

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
        amountMin: "Min Amount", amountMax: "Max Amount", unique: "Unique Only", groupDuplicates: "Group Dups",
        sortMode: "Sort Mode", generate: "Forge Numbers", results: "Results", saveBtn: "Save", loadBtn: "Load",
        advancedSettings: "Advanced Settings", highlightRules: "Highlight Rules (Max 10)",
        generated: "Count", sum: "Sum", average: "Avg", min: "Min", max: "Max", ruleStats: "Rule Stats",
        howToUse: "How to Use RNG Generator",
        guide1Title: "Range", guide1Desc: "Set min/max/amount. Big numbers OK.",
        guide2Title: "Advanced", guide2Desc: "Adjust Unique, Log, and CSV exclusion.",
        guide3Title: "Preset", guide3Desc: "Alias settings and save to 10 slots.",
        guide4Title: "Export", guide4Desc: "Download TXT/CSV with auto statistics."
    },
    ja: {
        subtitle: "プロ仕様RNGツール", settings: "生成設定", minimum: "最小値", maximum: "最大値",
        decimalMode: "小数を生成", precision: "小数桁数", amount: "個数", randomAmount: "個数をランダム化",
        amountMin: "最小個数", amountMax: "最大個数", unique: "重複なし", groupDuplicates: "重複をまとめる",
        sortMode: "並び順", generate: "数値を生成", results: "結果表示", saveBtn: "保存", loadBtn: "読み込み",
        advancedSettings: "高度な設定", highlightRules: "ハイライトルール (最大10)",
        generated: "生成数", sum: "合計", average: "平均値", min: "最小値", max: "最大値", ruleStats: "ルール統計",
        howToUse: "操作ガイド",
        guide1Title: "基本設定", guide1Desc: "最小・最大・個数を設定。巨大な数値も対応。",
        guide2Title: "詳細機能", guide2Desc: "重複排除、対数重み、除外リスト設定可能。",
        guide3Title: "プリセット", guide3Desc: "設定を10個のスロットに保存可能。",
        guide4Title: "書き出し", guide4Desc: "TXT/CSV形式で統計と共に保存可能。"
    }
};

let slotNames = JSON.parse(localStorage.getItem("rng_names") || "{}");

function updatePrecisionDisplay(val) { document.getElementById("precisionValue").textContent = val; }
function toggleDecimalOptions() { document.getElementById("precisionGroup").style.display = document.getElementById("decimalMode").checked ? "block" : "none"; }
function toggleAmountOptions() {
    const isRandom = document.getElementById("randomAmountMode").checked;
    document.getElementById("randomAmountInputs").style.display = isRandom ? "block" : "none";
    document.getElementById("amount").disabled = isRandom;
    document.getElementById("amount").style.opacity = isRandom ? "0.4" : "1";
}

function setLanguage(l) {
    currentLanguage = l;
    const t = translations[l];
    document.querySelectorAll("[data-lang]").forEach(el => {
        if (t[el.dataset.lang]) el.textContent = t[el.dataset.lang];
    });
}

function initHighlightInputs() {
    const container = document.getElementById("highlightRulesContainer");
    let html = "";
    for (let i = 0; i < 10; i++) {
        html += `<div class="rule-row">
            <span class="rule-num">${i + 1}</span>
            <input type="text" id="hName_${i}" placeholder="Name">
            <input type="number" id="hMin_${i}" placeholder="Min">
            <input type="number" id="hMax_${i}" placeholder="Max">
            <input type="text" id="hPre_${i}" placeholder="Pre">
            <input type="text" id="hSuf_${i}" placeholder="Suf">
            <input type="color" id="hCol_${i}" value="#7aa2ff">
        </div>`;
    }
    container.innerHTML = html;
}

function initSlots() {
    const container = document.getElementById('slotContainer');
    container.innerHTML = "";
    for (let i = 1; i <= 10; i++) {
        const btn = document.createElement('button');
        btn.className = `slot-btn ${i === currentSlot ? 'active' : ''}`;
        btn.onclick = () => { currentSlot = i; initSlots(); document.getElementById('slotName').value = slotNames[i] || ""; loadSettings(); };
        btn.innerHTML = `<div>${i}</div><div class="slot-alias">${slotNames[i] || ""}</div>`;
        container.appendChild(btn);
    }
}

function saveSettings() {
    const settings = {};
    SETTINGS_KEYS.forEach(k => {
        const el = document.getElementById(k);
        if (el) settings[k] = el.type === "checkbox" ? el.checked : el.value;
    });
    slotNames[currentSlot] = document.getElementById('slotName').value;
    localStorage.setItem("rng_names", JSON.stringify(slotNames));
    localStorage.setItem(`rng_slot_${currentSlot}`, JSON.stringify(settings));
    initSlots();
}

function loadSettings() {
    const data = localStorage.getItem(`rng_slot_${currentSlot}`);
    if (!data) return;
    const s = JSON.parse(data);
    SETTINGS_KEYS.forEach(k => {
        const el = document.getElementById(k);
        if (el && s[k] !== undefined) {
            if (el.type === "checkbox") el.checked = s[k];
            else el.value = s[k];
        }
    });
    updatePrecisionDisplay(document.getElementById("precision").value);
    toggleDecimalOptions();
    toggleAmountOptions();
}

function generate() {
    const resDiv = document.getElementById("result");
    const minRaw = document.getElementById("min").value, maxRaw = document.getElementById("max").value;
    const amountRaw = document.getElementById("amount").value, stepRaw = document.getElementById("step").value;
    const min = Number(minRaw), max = Number(maxRaw), step = Number(stepRaw);
    const isDec = document.getElementById("decimalMode").checked, prec = isDec ? Number(document.getElementById("precision").value) : 0;
    const isLog = document.getElementById("logMode").checked, isUnique = document.getElementById("unique").checked;

    let errorMsg = "";
    if (minRaw === "" || maxRaw === "" || (!document.getElementById("randomAmountMode").checked && amountRaw === "")) {
        errorMsg = currentLanguage === "ja" ? "最小値、最大値、個数のいずれかが空欄です。" : "Min, Max, or Amount is empty.";
    } else if (stepRaw === "" || step <= 0) {
        errorMsg = currentLanguage === "ja" ? "刻み値を正しく入力してください。" : "Please enter a valid Step.";
    } else if (min > max) {
        errorMsg = currentLanguage === "ja" ? "最小値が最大値を超えています。" : "Min cannot be greater than Max.";
    }

    if (errorMsg) { resDiv.innerHTML = `<div class="error">${errorMsg}</div>`; return; }

    let amt = document.getElementById("randomAmountMode").checked ? 
        Math.floor(Math.random() * (Number(document.getElementById("amountMax").value) - Number(document.getElementById("amountMin").value) + 1)) + Number(document.getElementById("amountMin").value) : Number(amountRaw);

    if (isUnique && amt > (Math.floor((max - min) / step) + 1)) {
        const msg = currentLanguage === "ja" ? "重複無しで生成する個数が範囲を超えています。" : "Unique range capacity exceeded.";
        resDiv.innerHTML = `<div class="error">${msg}</div>`; return;
    }

    const exclude = new Set((document.getElementById("exclude").value || "").split(',').map(n => Number(n.trim())).filter(n => !isNaN(n)));
    let results = [], attempts = 0;
    while (results.length < amt && attempts < 100000) {
        let val = isLog ? Math.exp(Math.log(min || 1e-15) + Math.random() * (Math.log(max || 1) - Math.log(min || 1e-15))) : min + Math.random() * (max - min);
        val = parseFloat((Math.round((val - min) / step) * step + min).toFixed(prec));
        if (val >= min && val <= max && !exclude.has(val) && (!isUnique || !results.includes(val))) results.push(val);
        attempts++;
    }

    lastGeneratedData = [...results];
    renderResultsUI(results, min, max, prec, isDec);
}

function renderResultsUI(results, min, max, prec, isDec) {
    const resDiv = document.getElementById("result"), t = translations[currentLanguage];
    const sortMode = document.getElementById("sortMode").value;
    if (sortMode === "asc") results.sort((a, b) => a - b);
    else if (sortMode === "desc") results.sort((a, b) => b - a);

    const actualMin = results.length > 0 ? Math.min(...results) : 0;
    const actualMax = results.length > 0 ? Math.max(...results) : 0;
    const sum = results.reduce((a, b) => a + b, 0);

    const hRules = [];
    for (let i = 0; i < 10; i++) {
        const hMin = document.getElementById(`hMin_${i}`).value, hMax = document.getElementById(`hMax_${i}`).value;
        if (hMin !== "" || hMax !== "") {
            hRules.push({
                min: hMin === "" ? -Infinity : Number(hMin),
                max: hMax === "" ? Infinity : Number(hMax),
                pre: document.getElementById(`hPre_${i}`).value,
                suf: document.getElementById(`hSuf_${i}`).value,
                col: document.getElementById(`hCol_${i}`).value,
                name: document.getElementById(`hName_${i}`).value || `Rule ${i+1}`,
                count: 0
            });
        }
    }
    lastUsedRules = hRules;

    const tagData = results.map(v => {
        let p = document.getElementById("prefix").value, s = document.getElementById("suffix").value, st = "", cls = ["tag"];
        if (v === actualMin) cls.push("min-tag");
        if (v === actualMax) cls.push("max-tag");
        for (let r of hRules) {
            if (v >= r.min && v <= r.max) {
                r.count++; p = r.pre + p; s = s + r.suf;
                const rgb = parseInt(r.col.slice(1,3),16)+","+parseInt(r.col.slice(3,5),16)+","+parseInt(r.col.slice(5,7),16);
                st = `--h-col:${r.col};--h-bg:rgba(${rgb},0.15);--h-glow:rgba(${rgb},0.3);`;
                cls.push("custom-highlight"); break;
            }
        }
        return { v: Number(v), p, s, st, cls };
    });

    let displayItems = document.getElementById("groupDuplicates").checked ? Array.from(tagData.reduce((m, item) => {
        const e = m.get(item.v); if (e) e.count++; else m.set(item.v, { ...item, count: 1 }); return m;
    }, new Map()).values()) : tagData.map(d => ({ ...d, count: 1 }));

    const padLen = document.getElementById("zeroPadding").checked ? Math.max(Math.floor(min).toString().length, Math.floor(max).toString().length) : 0;
    const tagsHtml = displayItems.map(i => {
        const dVal = isDec ? i.v.toFixed(prec) : i.v.toString().padStart(padLen, '0');
        return `<span class="${i.cls.join(' ')}" style="${i.st}">${i.p}${dVal}${i.s}${i.count > 1 ? ' (x' + i.count + ')' : ''}</span>`;
    }).join('');

    const fmt = (n) => (n > 1e9 || n < -1e9 || (n !== 0 && Math.abs(n) < 1e-4)) ? n.toExponential(2) : n.toLocaleString();

    let statsHtml = `<div class="stats">
        <div><strong>${t.generated}</strong>${results.length}</div>
        <div><strong>${t.sum}</strong>${fmt(sum)}</div>
        <div><strong>${t.average}</strong>${fmt(sum / (results.length || 1))}</div>
        <div><strong>${t.min}</strong>${fmt(actualMin)}</div>
        <div><strong>${t.max}</strong>${fmt(actualMax)}</div>
    </div>`;

    if (hRules.length > 0) {
        statsHtml += `<div class="rule-stats-box"><div class="stats-label">${t.ruleStats}</div><div class="rule-stats-grid">` + 
            hRules.filter(r => r.count > 0).map(r => `<div class="rule-stat-item" style="--line-col: ${r.col}"><span>${r.name}</span><strong>${r.count}</strong></div>`).join('') + `</div></div>`;
    }
    resDiv.innerHTML = statsHtml + `<div class="result-tags">${tagsHtml}</div>`;
}

function downloadResults(type) {
    if (lastGeneratedData.length === 0) return;
    const t = translations[currentLanguage];
    const sum = lastGeneratedData.reduce((a, b) => a + b, 0);
    const min = Math.min(...lastGeneratedData), max = Math.max(...lastGeneratedData);
    const fmt = (n) => (n > 1e9 || n < -1e9 || (n !== 0 && Math.abs(n) < 1e-4)) ? n.toExponential(2) : n.toString();

    let header = `[STATISTICS]\n`;
    header += `${t.generated}: ${lastGeneratedData.length}\n${t.sum}: ${fmt(sum)}\n${t.average}: ${fmt(sum / lastGeneratedData.length)}\n${t.min}: ${fmt(min)}\n${t.max}: ${fmt(max)}\n\n`;

    if (lastUsedRules.length > 0) {
        header += `[RULE DISTRIBUTION]\n`;
        lastUsedRules.forEach(r => {
            if (r.count > 0) {
                const rMin = r.min === -Infinity ? '*' : r.min, rMax = r.max === Infinity ? '*' : r.max;
                header += `${r.name} [${rMin} ~ ${rMax}] : ${r.count}\n`;
            }
        });
        header += `\n`;
    }

    header += `[DATA]\n`;
    const finalContent = header + lastGeneratedData.join('\n');
    const blob = new Blob([finalContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rng_results_${new Date().getTime()}.${type}`;
    a.click();
    URL.revokeObjectURL(url);
}

window.onload = () => { initHighlightInputs(); initSlots(); setLanguage('ja'); };

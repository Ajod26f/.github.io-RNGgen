let currentLanguage = "ja";
let currentSlot = 1;
let lastGeneratedData = [];
let lastUsedRules = [];
let currentIndexCounter = 0;

// Per-slot counters
let slotCounters = JSON.parse(localStorage.getItem("rng_v3_counters") || "{}");

const SETTINGS_KEYS = [
    "min", "max", "decimalMode", "precision", "amount", "randomAmountMode", 
    "amountMin", "amountMax", "step", "exclude", "prefix", "suffix", 
    "logMode", "zeroPadding", "sortMode", "groupDuplicates", "unique",
    "appendResults", "addIndex", "maintainIndex"
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
        guide2Title: "Advanced", guide2Desc: "Adjust Unique, Log, and CSV exclusion (e.g. 10, 20-50).",
        guide3Title: "Preset", guide3Desc: "Alias settings and save to 10 slots.",
        guide4Title: "Export", guide4Desc: "Download TXT/CSV with auto statistics.",
        logModeMinError: "When Log Mode is enabled, Min must be greater than 0.",
        counters: "Counters", attempts: "Attempts", totalGenerated: "Total Generated", resetCounters: "Reset Counters",
        resultOptions: "Result Options", appendResults: "Append to Previous", 
        addIndex: "Add Index to Prefix",
        maintainIndex: "Maintain Index After Clear",
        clear: "Clear", 
        resultExceedsLimit: "Results cannot exceed 100,000 items. Please clear the results first.",
        resultCleared: "Results cleared.",
        amountExceedsLimit: "Cannot generate more than 10,001 items at once. Please reduce the amount.",
        step: "Step", exclude: "Exclude (csv)", prefix: "Prefix", suffix: "Suffix"
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
        guide2Title: "詳細機能", guide2Desc: "重複排除、除外（10, 20-50形式対応）設定可能。",
        guide3Title: "プリセット", guide3Desc: "設定を10個のスロットに保存可能。",
        guide4Title: "書き出し", guide4Desc: "TXT/CSV形式で統計と共に保存可能。",
        logModeMinError: "対数重み付けモードでは、最小値は0より大きい必要があります。",
        counters: "カウンター", attempts: "試行回数", totalGenerated: "累計生成数", resetCounters: "リセット",
        resultOptions: "結果オプション", appendResults: "前の結果に追加", 
        addIndex: "接頭辞に生成番号を追加",
        maintainIndex: "結果クリア後も生成番号を維持", 
        clear: "クリア", 
        resultExceedsLimit: "結果は100,000個以上維持することはできません。結果をクリアしてください。",
        resultCleared: "結果をクリアしました。",
        amountExceedsLimit: "一度に10,001個以上は生成できません。個数を減らしてください。",
        step: "刻み値", exclude: "除外 (csv)", prefix: "接頭辞", suffix: "接尾辞"
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
    updateCounterDisplay();
}

function initHighlightInputs() {
    const container = document.getElementById("highlightRulesContainer");
    let html = "";
    for (let i = 0; i < 10; i++) {
        html += `<div class="rule-row"><span class="rule-num">${i + 1}</span><input type="text" id="hName_${i}" placeholder="Name"><input type="number" id="hMin_${i}" placeholder="Min"><input type="number" id="hMax_${i}" placeholder="Max"><input type="text" id="hPre_${i}" placeholder="Prefix"><input type="text" id="hSuf_${i}" placeholder="Suffix"><input type="color" id="hCol_${i}" value="#7aa2ff"></div>`;
    }
    container.innerHTML = html;
}

function initSlots() {
    const container = document.getElementById('slotContainer');
    container.innerHTML = "";
    for (let i = 1; i <= 10; i++) {
        const btn = document.createElement('button');
        btn.className = `slot-btn ${i === currentSlot ? 'active' : ''}`;
        btn.onclick = () => { currentSlot = i; initSlots(); document.getElementById('slotName').value = slotNames[i] || ""; updateCounterDisplay(); loadSettings(); };
        btn.innerHTML = `<div>${i}</div><div class="slot-alias">${slotNames[i] || ""}</div>`;
        container.appendChild(btn);
    }
}

function updateCounterDisplay() {
    const t = translations[currentLanguage];
    const counter = slotCounters[currentSlot] || { attempts: 0, total: 0 };
    
    let counterHtml = document.getElementById("counterDisplay");
    if (!counterHtml) {
        counterHtml = document.createElement('div');
        counterHtml.id = "counterDisplay";
        counterHtml.className = "counter-display";
        document.querySelector('.preset-section').appendChild(counterHtml);
    }
    
    counterHtml.innerHTML = `
        <div class="counter-item">
            <span class="counter-label">${t.attempts}</span>
            <span class="counter-value">${counter.attempts}</span>
        </div>
        <div class="counter-item">
            <span class="counter-label">${t.totalGenerated}</span>
            <span class="counter-value">${counter.total}</span>
        </div>
        <button onclick="resetSlotCounters()" class="reset-counter-btn" style="margin-top: 10px; padding: 6px 10px; font-size: 0.7rem;">${t.resetCounters}</button>
    `;
}

function incrementCounters(totalGenerated) {
    if (!slotCounters[currentSlot]) {
        slotCounters[currentSlot] = { attempts: 0, total: 0 };
    }
    slotCounters[currentSlot].attempts++;
    slotCounters[currentSlot].total += totalGenerated;
    localStorage.setItem("rng_v3_counters", JSON.stringify(slotCounters));
    updateCounterDisplay();
}

function resetSlotCounters() {
    const t = translations[currentLanguage];
    if (confirm(currentLanguage === 'ja' ? `スロット ${currentSlot} のカウンターをリセットしますか？` : `Reset counters for Slot ${currentSlot}?`)) {
        slotCounters[currentSlot] = { attempts: 0, total: 0 };
        localStorage.setItem("rng_v3_counters", JSON.stringify(slotCounters));
        updateCounterDisplay();
        const msg = currentLanguage === 'ja' ? "カウンターをリセットしました" : "Counters reset";
        showToast(msg);
    }
}

function saveSettings() {
    const settings = {};
    SETTINGS_KEYS.forEach(key => {
        const el = document.getElementById(key);
        if (el) {
            settings[key] = el.type === "checkbox" ? el.checked : el.value;
        }
    });

    const name = document.getElementById('slotName').value;
    slotNames[currentSlot] = name || `-`;
    
    localStorage.setItem("rng_v3_names", JSON.stringify(slotNames));
    localStorage.setItem(`rng_v3_slot_${currentSlot}`, JSON.stringify(settings));
    
    initSlots();
    const msg = currentLanguage === 'ja' 
        ? `スロット ${currentSlot} に保存しました` 
        : `Saved to Slot ${currentSlot}`;
    showToast(msg);
}

function loadSettings() {
    const saved = localStorage.getItem(`rng_v3_slot_${currentSlot}`);
    if (!saved) {
        const errorMsg = currentLanguage === 'ja' ? "データがありません" : "No data found";
        showToast(errorMsg);
        return;
    }

    const s = JSON.parse(saved);
    SETTINGS_KEYS.forEach(k => {
        const el = document.getElementById(k);
        if (el) {
            if (el.type === "checkbox") {
                el.checked = s[k] ?? false;
            } else {
                el.value = s[k] ?? "";
            }
        }
    });

    toggleDecimalOptions();
    toggleAmountOptions();
    
    const msg = currentLanguage === 'ja' 
        ? `スロット ${currentSlot} を読み込みました` 
        : `Loaded Slot ${currentSlot}`;
    showToast(msg);
}

function parseExcludes(input) {
    const excludes = { singles: new Set(), ranges: [] };
    if (!input.trim()) return excludes;
    input.split(',').forEach(part => {
        const p = part.trim();
        if (p.includes('-')) {
            const [start, end] = p.split('-').map(Number);
            if (!isNaN(start) && !isNaN(end)) excludes.ranges.push({ start: Math.min(start, end), end: Math.max(start, end) });
        } else {
            const val = Number(p); if (!isNaN(val)) excludes.singles.add(val);
        }
    });
    return excludes;
}

function isExcluded(val, excludes) {
    if (excludes.singles.has(val)) return true;
    for (const r of excludes.ranges) { if (val >= r.start && val <= r.end) return true; }
    return false;
}

function generate() {
    const resDiv = document.getElementById("result");
    const minRaw = document.getElementById("min").value, maxRaw = document.getElementById("max").value;
    const amountRaw = document.getElementById("amount").value, stepRaw = document.getElementById("step").value;
    
    let min = Number(minRaw), max = Number(maxRaw), step = Number(stepRaw);
    const isDec = document.getElementById("decimalMode").checked, prec = isDec ? Number(document.getElementById("precision").value) : 0;
    const isLog = document.getElementById("logMode").checked, isUnique = document.getElementById("unique").checked;

    const minStepLimit = isDec ? Math.pow(10, -prec) : 1;
    if (step < minStepLimit) step = minStepLimit;

    let errors = [];
    if (minRaw === "" || maxRaw === "" || (!document.getElementById("randomAmountMode").checked && amountRaw === "")) {
        errors.push(currentLanguage === "ja" ? "最小値、最大値、個数のいずれかが空欄です。" : "Min, Max, or Amount is empty.");
    }
    if (stepRaw === "" || step <= 0) {
        errors.push(currentLanguage === "ja" ? "刻み値を正しく入力してください。" : "Please enter a valid Step.");
    }
    if (min > max) {
        errors.push(currentLanguage === "ja" ? "最小値が最大値を超えています。" : "Min cannot be greater than Max.");
    }
    if (isLog && min <= 0) {
        errors.push(translations[currentLanguage].logModeMinError);
    }
    
    if (errors.length > 0) {
        const errorHtml = errors.map(e => `<div class="error">${e}</div>`).join('');
        resDiv.innerHTML = errorHtml;
        return;
    }

    let amt = document.getElementById("randomAmountMode").checked ? 
        Math.floor(Math.random() * (Number(document.getElementById("amountMax").value) - Number(document.getElementById("amountMin").value) + 1)) + Number(document.getElementById("amountMin").value) :
        Number(amountRaw);

    if (amt >= 10001) {
        resDiv.innerHTML = `<div class="error">${translations[currentLanguage].amountExceedsLimit}</div>`;
        return;
    }

    // --- インデックスのリセット判定 (ここが修正ポイント) ---
    const shouldAppend = document.getElementById("appendResults").checked;
    const maintainIndex = document.getElementById("maintainIndex").checked;

    // 「追加モード」がオフで、かつ「インデックス維持」もオフなら、今回の生成前に0に戻す
    if (!shouldAppend && !maintainIndex) {
        currentIndexCounter = 0;
    }
    // --------------------------------------------------

    const excludes = parseExcludes(document.getElementById("exclude").value);
    const rangeCount = Math.floor(((max - min) + (step * 0.000001)) / step) + 1;

    if (isUnique) {
        let blocked = 0;
        if (rangeCount < 1000000) {
            for (let i = 0; i < rangeCount; i++) {
                const checkVal = parseFloat((min + i * step).toFixed(prec));
                if (isExcluded(checkVal, excludes)) blocked++;
            }
        } else { blocked = excludes.singles.size; }

        const available = rangeCount - blocked;
        if (amt > available) {
            const msg = currentLanguage === "ja" ? `生成可能な数は最大 ${available} 個です。` : `Max available is ${available}.`;
            resDiv.innerHTML = `<div class="error">${msg}</div>`; return;
        }
    }

    let results = [], resultSet = new Set(), attempts = 0, maxAt = Math.max(amt * 250, 200000);
    
    while (results.length < amt && attempts < maxAt) {
        let roundedVal;
        if (isLog) {
            let val = Math.exp(Math.log(min || 1e-15) + Math.random() * (Math.log(max || 1) - Math.log(min || 1e-15)));
            roundedVal = parseFloat((Math.round((val - min) / step) * step + min).toFixed(prec));
        } else {
            let randomIndex = Math.floor(Math.random() * rangeCount);
            roundedVal = parseFloat((min + randomIndex * step).toFixed(prec));
        }
        
        if (roundedVal >= min && roundedVal <= max && !isExcluded(roundedVal, excludes)) {
            const strVal = roundedVal.toFixed(prec);
            if (!isUnique || !resultSet.has(strVal)) {
                results.push(roundedVal);
                if (isUnique) resultSet.add(strVal);
            }
        }
        attempts++;
    }

    // データの作成（currentIndexCounterをベースにindexを振る）
    const newData = results.map((v, idx) => ({
        value: v,
        indexAtGeneration: currentIndexCounter + idx + 1
    }));

    if (shouldAppend && lastGeneratedData.length > 0) {
        lastGeneratedData = [...lastGeneratedData, ...newData];
    } else {
        lastGeneratedData = [...newData];
    }

    if (lastGeneratedData.length > 100000) {
        const t = translations[currentLanguage];
        resDiv.innerHTML = `<div class="error">${t.resultExceedsLimit}</div>`;
        lastGeneratedData = [];
        currentIndexCounter = 0;
        return;
    }

    incrementCounters(results.length);
    // 次回の生成（追加モード用）のためにカウンターを進める
    currentIndexCounter += results.length; 
    renderResultsUI(min, max, prec, isDec);
}

function renderResultsUI(min, max, prec, isDec) {
    const resDiv = document.getElementById("result"), t = translations[currentLanguage];
    let results = [...lastGeneratedData];
    
    const sortMode = document.getElementById("sortMode").value;
    if (sortMode === "asc") results.sort((a, b) => a.value - b.value);
    else if (sortMode === "desc") results.sort((a, b) => b.value - a.value);

    const actualMin = results.length > 0 ? Math.min(...results.map(r => r.value)) : 0;
    const actualMax = results.length > 0 ? Math.max(...results.map(r => r.value)) : 0;
    const sum = results.reduce((a, b) => a + b.value, 0);

    const hRules = [];
    for (let i = 0; i < 10; i++) {
        const hMin = document.getElementById(`hMin_${i}`).value, hMax = document.getElementById(`hMax_${i}`).value;
        if (hMin !== "" || hMax !== "") {
            hRules.push({ min: hMin === "" ? -Infinity : Number(hMin), max: hMax === "" ? Infinity : Number(hMax), pre: document.getElementById(`hPre_${i}`).value, suf: document.getElementById(`hSuf_${i}`).value, name: document.getElementById(`hName_${i}`).value, col: document.getElementById(`hCol_${i}`).value, count: 0 });
        }
    }
    lastUsedRules = hRules;

    const addIndexMode = document.getElementById("addIndex").checked;
    const tagData = results.map((item) => {
        const v = item.value;
        let p = document.getElementById("prefix").value, s = document.getElementById("suffix").value, st = "", cls = ["tag"];
        if (addIndexMode) {
            p = `<span class="index-prefix">#${item.indexAtGeneration}</span> ` + p;
        }
        if (v === actualMin) cls.push("min-tag"); if (v === actualMax) cls.push("max-tag");
        for (let r of hRules) {
            if (v >= r.min && v <= r.max) {
                r.count++; p = r.pre + p; s = s + r.suf;
                const rgb = parseInt(r.col.slice(1,3),16)+","+parseInt(r.col.slice(3,5),16)+","+parseInt(r.col.slice(5,7),16);
                st = `--h-col:${r.col};--h-bg:rgba(${rgb},0.15);--h-glow:rgba(${rgb},0.3);`;
                cls.push("custom-highlight"); break;
            }
        }
        return { v: Number(v), idx: item.indexAtGeneration, p, s, st, cls };
    });

    let displayItems;
    if (document.getElementById("groupDuplicates").checked) {
        const grouped = new Map();
        tagData.forEach(item => {
            const key = item.v.toString();
            if (!grouped.has(key)) {
                grouped.set(key, { ...item, count: 1 });
            } else {
                const existing = grouped.get(key);
                existing.count++;
                // Update to max index
                existing.idx = Math.max(existing.idx, item.idx);
                // Update prefix with max index
                if (addIndexMode) {
                    const prefix = document.getElementById("prefix").value;
                    existing.p = `<span class="index-prefix">#${existing.idx}</span> ` + prefix;
                }
            }
        });
        displayItems = Array.from(grouped.values());
    } else {
        displayItems = tagData.map(d => ({ ...d, count: 1 }));
    }

    const padLen = document.getElementById("zeroPadding").checked ? Math.max(Math.floor(min).toString().length, Math.floor(max).toString().length) : 0;
    const tagsHtml = displayItems.map(i => {
        const dVal = isDec ? i.v.toFixed(prec) : i.v.toString().padStart(padLen, '0');
        return `<span class="${i.cls.join(' ')}" style="${i.st}">${i.p}${dVal}${i.s}${i.count > 1 ? ' (x' + i.count + ')' : ''}</span>`;
    }).join('');

    const fmt = (n) => (n > 1e9 || n < -1e9 || (n !== 0 && Math.abs(n) < 1e-4)) ? n.toExponential(2) : n.toLocaleString();
    const resultValues = results.map(r => r.value);
    let statsHtml = `<div class="stats"><div><strong>${t.generated}</strong>${results.length}</div><div><strong>${t.sum}</strong>${fmt(sum)}</div><div><strong>${t.average}</strong>${fmt(sum / (results.length || 1))}</div><div><strong>${t.min}</strong>${fmt(actualMin)}</div><div><strong>${t.max}</strong>${fmt(actualMax)}</div></div>`;

    if (hRules.length > 0) {
        statsHtml += `<div class="rule-stats-box"><div class="stats-label">${t.ruleStats}</div><div class="rule-stats-grid">` + hRules.filter(r => r.count > 0).map(r => `<div class="rule-stat-item" style="--line-col:${r.col}">${r.name || 'Rule'}: ${r.count}</div>`).join('') + `</div></div>`;
    }
    resDiv.innerHTML = statsHtml + `<div class="result-tags">${tagsHtml}</div>`;
}

function clearResults() {
    const t = translations[currentLanguage];
    lastGeneratedData = [];
    if (!document.getElementById("maintainIndex").checked) {
        currentIndexCounter = 0;
    }
    document.getElementById("result").innerHTML = `<span style="color: #64748b;">Ready...</span>`;
    showToast(t.resultCleared);
}

function downloadResults(type) {
    if (lastGeneratedData.length === 0) return;
    const t = translations[currentLanguage];
    const resultValues = lastGeneratedData.map(item => item.value);
    const sum = resultValues.reduce((a, b) => a + b, 0);
    const fmt = (n) => (n > 1e9 || n < -1e9 || (n !== 0 && Math.abs(n) < 1e-4)) ? n.toExponential(2) : n.toString();
    let header = `[STATISTICS]\n${t.generated}: ${resultValues.length}\n${t.sum}: ${fmt(sum)}\n${t.average}: ${fmt(sum / resultValues.length)}\n${t.min}: ${fmt(Math.min(...resultValues))}\n${t.max}: ${fmt(Math.max(...resultValues))}\n\n`;
    if (lastUsedRules.length > 0) {
        header += `[RULE DISTRIBUTION]\n`;
        lastUsedRules.forEach(r => { if (r.count > 0) header += `${r.name} [${r.min === -Infinity ? '*' : r.min} ~ ${r.max === Infinity ? '*' : r.max}] : ${r.count}\n`; });
        header += `\n`;
    }
    const blob = new Blob([header + `[DATA]\n` + resultValues.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `rng_results_${new Date().getTime()}.${type}`; a.click();
    URL.revokeObjectURL(url);
}

function showToast(message) {
    const oldToast = document.querySelector('.toast');
    if (oldToast) oldToast.remove();

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 10);

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, 2500);
}

window.onload = () => { initHighlightInputs(); initSlots(); setLanguage('ja'); updateCounterDisplay(); };

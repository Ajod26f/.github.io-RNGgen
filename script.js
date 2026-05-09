let currentLanguage = "ja";
let currentSlot = 1;
let lastResults = { data: [], stats: {} };

// 設定保存用キー（ハイライト10枠分に hName_i を追加）
const SETTINGS_KEYS = ["min", "max", "decimalMode", "precision", "amount", "randomAmountMode", "amountMin", "amountMax", "step", "exclude", "prefix", "suffix", "logMode", "zeroPadding", "sortMode", "groupDuplicates", "unique"];
for (let i = 0; i < 10; i++) {
    SETTINGS_KEYS.push(`hName_${i}`, `hMin_${i}`, `hMax_${i}`, `hPre_${i}`, `hSuf_${i}`, `hCol_${i}`);
}

const translations = {
    en: {
        subtitle: "Professional RNG Machine", settings: "Generator Settings", minimum: "Min", maximum: "Max",
        decimalMode: "Decimals", precision: "Places", amount: "Amount", randomAmount: "Random Amount",
        amountMin: "Min Amount", amountMax: "Max Amount", unique: "Unique Only", groupDuplicates: "Group Dups",
        sortMode: "Sort Mode", generate: "Forge Numbers", results: "Results",
        saveBtn: "Save", loadBtn: "Load", advancedSettings: "Advanced Settings",
        excludeNumbers: "Exclude (csv)", prefix: "Prefix", suffix: "Suffix",
        zeroPadding: "Zero Padding", step: "Step", logMode: "Log Weight",
        highlightRules: "Highlight Rules (Max 10)",
        emptyError: "Error: Min and Max fields cannot be empty.",
        logicError: "Error: Min is greater than Max.",
        capacityError: "Error: Range is too small for unique numbers.",
        overflowError: "Error: Number exceeds ±1.79e308 limit.",
        generated: "Count", sum: "Sum", average: "Avg", min: "Min", max: "Max"
    },
    ja: {
        subtitle: "いいね〜このRNG", settings: "生成設定", minimum: "最小値", maximum: "最大値",
        decimalMode: "小数を生成", precision: "小数桁数", amount: "個数", randomAmount: "個数をランダム化",
        amountMin: "最小個数", amountMax: "最大個数", unique: "重複なし", groupDuplicates: "重複をまとめる",
        sortMode: "並び順", generate: "数値を生成", results: "結果",
        saveBtn: "保存", loadBtn: "読み込み", advancedSettings: "高度な設定",
        excludeNumbers: "除外リスト(csv)", prefix: "接頭辞", suffix: "接尾辞",
        zeroPadding: "先頭を0で埋める", step: "刻み", logMode: "対数重み",
        highlightRules: "ハイライトルール (最大10枠)",
        emptyError: "エラー: 最小値と最大値を入力してください。",
        logicError: "エラー: 最小値が最大値を超えています。",
        capacityError: "エラー: 重複なしで生成する個数が指定範囲より大きいです。",
        overflowError: "エラー: 数値がシステム限界を超えました。",
        generated: "生成数", sum: "合計", average: "平均値", min: "最小値", max: "最大値"
    }
};

let slotNames = JSON.parse(localStorage.getItem("rng_forge_names") || "{}");

function setLanguage(l) {
    currentLanguage = l;
    document.querySelectorAll("[data-lang]").forEach(el => {
        const key = el.dataset.lang;
        if (translations[l][key]) el.textContent = translations[l][key];
    });
    const btn = document.querySelector("button[onclick='generate()']");
    if (btn) btn.textContent = translations[l].generate;
}

// ハイライト入力欄の生成
function initHighlightInputs() {
    const container = document.getElementById("highlightRulesContainer");
    if (!container) return;
    let html = "";
    for (let i = 0; i < 10; i++) {
        html += `
            <div class="rule-row" style="grid-template-columns: 30px 1.2fr 1fr 1fr 1fr 1fr 45px;">
                <span class="rule-num">${i + 1}</span>
                <input type="text" id="hName_${i}" placeholder="Rule Name">
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
    if (!container) return;
    container.innerHTML = "";
    for (let i = 1; i <= 10; i++) {
        const btn = document.createElement('button');
        btn.id = `slot-${i}`;
        btn.className = `slot-btn ${i === currentSlot ? 'active' : ''}`;
        btn.onclick = () => selectSlot(i);
        const name = slotNames[i] ? slotNames[i].substring(0, 6) : "";
        btn.innerHTML = `<div>${i}</div><div class="slot-alias">${name}</div>`;
        container.appendChild(btn);
    }
}

function selectSlot(num) {
    currentSlot = num;
    initSlots();
    const nameInput = document.getElementById('slotName');
    if (nameInput) nameInput.value = slotNames[num] || "";
}

function saveSettings(isAuto = false) {
    const settings = {};
    SETTINGS_KEYS.forEach(key => {
        const el = document.getElementById(key);
        if (el) settings[key] = el.type === "checkbox" ? el.checked : el.value;
    });
    if (!isAuto) {
        const nameInput = document.getElementById('slotName');
        slotNames[currentSlot] = nameInput ? nameInput.value : "";
        localStorage.setItem("rng_forge_names", JSON.stringify(slotNames));
        initSlots();
    }
    localStorage.setItem(isAuto ? "rng_forge_auto" : `rng_forge_slot_${currentSlot}`, JSON.stringify(settings));
    if (!isAuto) showToast(currentLanguage === 'ja' ? `スロット ${currentSlot} に保存しました` : `Saved Slot ${currentSlot}`);
}

function loadSettings(isInitial = false) {
    const saved = localStorage.getItem(isInitial ? "rng_forge_auto" : `rng_forge_slot_${currentSlot}`);
    if (!saved) return;
    const settings = JSON.parse(saved);
    SETTINGS_KEYS.forEach(k => {
        const el = document.getElementById(k);
        if (el) {
            if (el.type === "checkbox") el.checked = settings[k] ?? false;
            else el.value = settings[k] ?? "";
        }
    });
    toggleDecimalOptions();
    toggleAmountOptions();
    if (!isInitial) showToast(currentLanguage === 'ja' ? `スロット ${currentSlot} を読み込みました` : "Loaded Slot " + currentSlot);
}

function showToast(msg) {
    const t = document.createElement('div');
    t.textContent = msg;
    t.style.cssText = `position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); background: #00ffd5; color: #0f172a; padding: 10px 20px; border-radius: 20px; font-weight: bold; z-index: 1000; box-shadow: 0 4px 15px rgba(0,255,213,0.3); transition: 0.5s; font-size: 0.8rem;`;
    document.body.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 500); }, 1500);
}

function toggleDecimalOptions() {
    const group = document.getElementById("precisionGroup");
    const check = document.getElementById("decimalMode");
    if (group && check) group.style.display = check.checked ? "block" : "none";
}

function toggleAmountOptions() {
    const isRnd = document.getElementById("randomAmountMode")?.checked;
    const inputs = document.getElementById("randomAmountInputs");
    const normal = document.getElementById("amount");
    if (inputs) inputs.style.display = isRnd ? "block" : "none";
    if (normal) normal.parentElement.style.display = isRnd ? "none" : "block";
}

function hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
    return `${r},${g},${b}`;
}

function formatValue(val, prec, isDec, pref, suff, zPad, padL) {
    let vStr;
    const p = pref || "";
    const s = suff || "";
    if (Math.abs(val) >= 1e15 || (Math.abs(val) < 1e-7 && val !== 0)) {
        vStr = val.toExponential(3);
    } else if (zPad && !isDec) {
        vStr = val.toString().padStart(padL, '0');
    } else {
        vStr = val.toLocaleString('en-US', { 
            minimumFractionDigits: isDec ? prec : 0, 
            maximumFractionDigits: isDec ? prec : 0, 
            useGrouping: false 
        });
    }
    return `${p}${vStr}${s}`;
}

function generate() {
    saveSettings(true);
    const resDiv = document.getElementById("result");
    const minRaw = document.getElementById("min").value;
    const maxRaw = document.getElementById("max").value;

    if (minRaw === "" || maxRaw === "") {
        resDiv.innerHTML = `<div class="error">${translations[currentLanguage].emptyError}</div>`;
        return;
    }

    const min = Number(minRaw), max = Number(maxRaw);
    if (min > max) {
        resDiv.innerHTML = `<div class="error">${translations[currentLanguage].logicError}</div>`;
        return;
    }

    const isDec = document.getElementById("decimalMode").checked;
    const step = Number(document.getElementById("step").value) || (isDec ? 0.1 : 1);
    const prec = isDec ? Math.min(Math.max(Number(document.getElementById("precision").value), 0), 8) : 0;
    const log = document.getElementById("logMode").checked;
    const unique = document.getElementById("unique").checked;
    const excl = (document.getElementById("exclude").value || "").split(',').map(n => Number(n.trim())).filter(n => !isNaN(n));

    let amt = document.getElementById("randomAmountMode").checked 
        ? Math.floor(Math.random() * (Number(document.getElementById("amountMax").value) - Number(document.getElementById("amountMin").value) + 1)) + Number(document.getElementById("amountMin").value)
        : Number(document.getElementById("amount").value);

    const getV = () => {
        let v;
        if (log) {
            const sMin = Math.max(min, isDec ? 1e-8 : 1);
            v = Math.pow(10, Math.random() * (Math.log10(max) - Math.log10(sMin)) + Math.log10(sMin));
        } else {
            v = min + (Math.floor(Math.random() * (Math.floor((max - min) / step) + 1)) * step);
        }
        return parseFloat(v.toFixed(prec));
    };

    let results = [];
    if (unique) {
        const s = new Set();
        let safe = 0;
        const rangeLimit = Math.floor((max - min) / step) + 1;
        if (amt > rangeLimit) amt = rangeLimit;
        while (s.size < amt && safe < 50000) {
            let v = getV();
            if (!excl.includes(v)) s.add(v);
            safe++;
        }
        results = [...s];
    } else {
        for (let i = 0; i < amt; i++) results.push(getV());
    }

    const sort = document.getElementById("sortMode").value;
    if (sort === "asc") results.sort((a, b) => a - b);
    else if (sort === "desc") results.sort((a, b) => b - a);

    const sum = results.reduce((a, b) => a + b, 0);
    const minV = results.length ? Math.min(...results) : 0;
    const maxV = results.length ? Math.max(...results) : 0;
    const avg = results.length ? sum / results.length : 0;

    // ハイライトルールの読み込み
    const hRules = [];
    for (let i = 0; i < 10; i++) {
        const hMinRaw = document.getElementById(`hMin_${i}`).value;
        const hMaxRaw = document.getElementById(`hMax_${i}`).value;
        if (hMinRaw !== "" || hMaxRaw !== "") {
            hRules.push({
                name: document.getElementById(`hName_${i}`).value || `RULE ${i + 1}`,
                min: hMinRaw !== "" ? Number(hMinRaw) : -Infinity,
                max: hMaxRaw !== "" ? Number(hMaxRaw) : Infinity,
                pre: document.getElementById(`hPre_${i}`).value || "",
                suf: document.getElementById(`hSuf_${i}`).value || "",
                col: document.getElementById(`hCol_${i}`).value || "#7aa2ff"
            });
        }
    }
    const ruleCounts = hRules.map(() => 0);

    const freq = {};
    results.forEach(v => freq[v] = (freq[v] || 0) + 1);
    const group = document.getElementById("groupDuplicates").checked;
    const pad = document.getElementById("zeroPadding").checked ? Math.max(Math.floor(min).toString().length, Math.floor(max).toString().length) : 0;
    const items = group ? Object.entries(freq).map(([v, c]) => ({ v: Number(v), c })) : results.map(v => ({ v, c: 1 }));

    const tagHtml = items.map(i => {
        let p = document.getElementById("prefix").value || "";
        let s = document.getElementById("suffix").value || "";
        let hClass = "", hStyle = "";
        for (let rIdx = 0; rIdx < hRules.length; rIdx++) {
            const rule = hRules[rIdx];
            if (i.v >= rule.min && i.v <= rule.max) {
                p = rule.pre + p; s = s + rule.suf;
                hClass = "custom-highlight";
                const rgb = hexToRgb(rule.col);
                hStyle = `--h-col: ${rule.col}; --h-bg: rgba(${rgb}, 0.15); --h-glow: rgba(${rgb}, 0.3);`;
                ruleCounts[rIdx] += i.c; 
                break;
            }
        }
        const edge = i.v === minV ? 'min-tag' : (i.v === maxV ? 'max-tag' : '');
        const formatted = formatValue(i.v, prec, isDec, p, s, document.getElementById("zeroPadding").checked, pad);
        return `<span class="tag ${edge} ${hClass}" style="${hStyle}">${formatted}${i.c > 1 ? ' (x' + i.c + ')' : ''}</span>`;
    }).join('');

    // ルール別統計
    let highlightStatsHtml = "";
    hRules.forEach((rule, idx) => {
        if (ruleCounts[idx] > 0) {
            highlightStatsHtml += `
                <div style="border-left: 3px solid ${rule.col}; padding: 2px 8px; background: rgba(255,255,255,0.03); border-radius: 4px;">
                    <span style="font-size: 0.6rem; color: #94a3b8; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${rule.name}</span>
                    <span style="color: ${rule.col}; font-weight: bold;">${ruleCounts[idx]}</span>
                </div>`;
        }
    });

    const t = translations[currentLanguage];
    resDiv.innerHTML = `
        <div class="stats">
            <div><strong>${t.generated}</strong>${results.length}</div>
            <div><strong>${t.sum}</strong>${sum.toLocaleString()}</div>
            <div><strong>${t.average}</strong>${avg.toFixed(prec)}</div>
            <div><strong>${t.min}</strong>${minV.toLocaleString()}</div>
            <div><strong>${t.max}</strong>${maxV.toLocaleString()}</div>
        </div>
        ${highlightStatsHtml ? `<div class="stats" style="grid-template-columns: repeat(auto-fit, minmax(80px, 1fr)); margin-top: -10px; margin-bottom: 20px; border-top: 1px solid #1e293b; padding-top: 10px;">${highlightStatsHtml}</div>` : ''}
        <div class="result-tags">${tagHtml}</div>`;
}

window.onload = () => {
    initHighlightInputs();
    initSlots();
    loadSettings(true);
    setLanguage('ja');
};

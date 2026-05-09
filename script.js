let currentLanguage = "ja";
let currentSlot = 1;
const SETTINGS_KEYS = ["min", "max", "decimalMode", "precision", "amount", "randomAmountMode", "amountMin", "amountMax", "step", "exclude", "prefix", "suffix", "logMode", "zeroPadding", "sortMode", "groupDuplicates", "unique"];
for (let i = 0; i < 10; i++) SETTINGS_KEYS.push(`hName_${i}`, `hMin_${i}`, `hMax_${i}`, `hPre_${i}`, `hSuf_${i}`, `hCol_${i}`);

const translations = {
    en: { subtitle: "Professional RNG Machine", settings: "Generator Settings", minimum: "Min", maximum: "Max", decimalMode: "Decimals", precision: "Places", amount: "Amount", randomAmount: "Random Amount", amountMin: "Min Amount", amountMax: "Max Amount", unique: "Unique Only", groupDuplicates: "Group Dups", sortMode: "Sort Mode", generate: "Forge Numbers", results: "Results", saveBtn: "Save", loadBtn: "Load", advancedSettings: "Advanced Settings", highlightRules: "Highlight Rules", emptyError: "Error: Fields empty.", logicError: "Error: Min > Max.", capacityError: "Error: Range too small for unique.", generated: "Count", sum: "Sum", average: "Avg", min: "Min", max: "Max" },
    ja: { subtitle: "このRNGが今熱い", settings: "生成設定", minimum: "最小値", maximum: "最大値", decimalMode: "小数を生成", precision: "小数桁数", amount: "個数", randomAmount: "個数をランダム化", amountMin: "最小個数", amountMax: "最大個数", unique: "重複なし", groupDuplicates: "重複をまとめる", sortMode: "並び順", generate: "数値を生成", results: "結果", saveBtn: "保存", loadBtn: "読み込み", advancedSettings: "高度な設定", highlightRules: "ハイライトルール", emptyError: "エラー: 空欄があります。", logicError: "エラー: 最小値が最大値を超えています。", capacityError: "エラー: 重複なしで生成可能な個数を超えています。", generated: "生成数", sum: "合計", average: "平均", min: "最小", max: "最大" }
};

let slotNames = JSON.parse(localStorage.getItem("rng_names") || "{}");

function setLanguage(l) {
    currentLanguage = l;
    document.querySelectorAll("[data-lang]").forEach(el => { if (translations[l][el.dataset.lang]) el.textContent = translations[l][el.dataset.lang]; });
    document.querySelector("button[onclick='generate()']").textContent = translations[l].generate;
}

function initHighlightInputs() {
    const c = document.getElementById("highlightRulesContainer");
    let h = "";
    for (let i = 0; i < 10; i++) h += `<div class="rule-row"><span class="rule-num">${i+1}</span><input type="text" id="hName_${i}" placeholder="Name"><input type="number" id="hMin_${i}" placeholder="Min"><input type="number" id="hMax_${i}" placeholder="Max"><input type="text" id="hPre_${i}" placeholder="Pre"><input type="text" id="hSuf_${i}" placeholder="Suf"><input type="color" id="hCol_${i}" value="#7aa2ff"></div>`;
    c.innerHTML = h;
}

function initSlots() {
    const c = document.getElementById('slotContainer');
    c.innerHTML = "";
    for (let i = 1; i <= 10; i++) {
        const b = document.createElement('button');
        b.className = `slot-btn ${i === currentSlot ? 'active' : ''}`;
        b.onclick = () => { currentSlot = i; initSlots(); document.getElementById('slotName').value = slotNames[i] || ""; };
        b.innerHTML = `<div>${i}</div><div style="font-size:0.5rem">${(slotNames[i] || "").slice(0,5)}</div>`;
        c.appendChild(b);
    }
}

function saveSettings(auto = false) {
    const s = {};
    SETTINGS_KEYS.forEach(k => { const e = document.getElementById(k); if (e) s[k] = e.type === "checkbox" ? e.checked : e.value; });
    if (!auto) { slotNames[currentSlot] = document.getElementById('slotName').value; localStorage.setItem("rng_names", JSON.stringify(slotNames)); initSlots(); }
    localStorage.setItem(auto ? "rng_auto" : `rng_slot_${currentSlot}`, JSON.stringify(s));
}

function loadSettings(init = false) {
    const d = localStorage.getItem(init ? "rng_auto" : `rng_slot_${currentSlot}`);
    if (!d) return;
    const s = JSON.parse(d);
    SETTINGS_KEYS.forEach(k => { const e = document.getElementById(k); if (e && s[k] !== undefined) { if (e.type === "checkbox") e.checked = s[k]; else e.value = s[k]; } });
    toggleDecimalOptions(); toggleAmountOptions();
}

function toggleDecimalOptions() { document.getElementById("precisionGroup").style.display = document.getElementById("decimalMode").checked ? "block" : "none"; }
function toggleAmountOptions() { const r = document.getElementById("randomAmountMode").checked; document.getElementById("randomAmountInputs").style.display = r ? "block" : "none"; document.getElementById("amount").parentElement.style.display = r ? "none" : "block"; }

function generate() {
    saveSettings(true);
    const resDiv = document.getElementById("result");
    const min = Number(document.getElementById("min").value), max = Number(document.getElementById("max").value);
    const isUnique = document.getElementById("unique").checked, step = Number(document.getElementById("step").value) || 1;
    let amt = document.getElementById("randomAmountMode").checked ? Math.floor(Math.random() * (Number(document.getElementById("amountMax").value) - Number(document.getElementById("amountMin").value) + 1)) + Number(document.getElementById("amountMin").value) : Number(document.getElementById("amount").value);
    const isDec = document.getElementById("decimalMode").checked, prec = isDec ? Number(document.getElementById("precision").value) : 0;
    const exclList = (document.getElementById("exclude").value || "").split(',').map(n => n.trim()).filter(n => n !== "").map(Number).filter(n => !isNaN(n));
    const exclSet = new Set(exclList);

    if (isUnique) {
        const limit = Math.floor((max - min) / step) + 1;
        const inRangeExcl = exclList.filter(n => n >= min && n <= max).length;
        if (amt > (limit - inRangeExcl)) { resDiv.innerHTML = `<div class="error">${translations[currentLanguage].capacityError}</div>`; return; }
    }

    let results = [];
    let safe = 0;
    const maxAttempts = 1000000;
    if (isUnique) {
        const s = new Set();
        while (s.size < amt && safe < maxAttempts) {
            let v = parseFloat((min + (Math.floor(Math.random() * (Math.floor((max - min) / step) + 1)) * step)).toFixed(prec));
            if (!exclSet.has(v)) s.add(v);
            safe++;
        }
        results = [...s];
    } else {
        while (results.length < amt && safe < maxAttempts) {
            let v = parseFloat((min + (Math.floor(Math.random() * (Math.floor((max - min) / step) + 1)) * step)).toFixed(prec));
            if (!exclSet.has(v)) results.push(v);
            safe++;
        }
    }

    if (results.length === 0) return;

    const actualMin = Math.min(...results);
    const actualMax = Math.max(...results);

    const sort = document.getElementById("sortMode").value;
    if (sort === "asc") results.sort((a, b) => a - b); else if (sort === "desc") results.sort((a, b) => b - a);

    const hRules = [];
    for (let i = 0; i < 10; i++) {
        const hMin = document.getElementById(`hMin_${i}`).value, hMax = document.getElementById(`hMax_${i}`).value;
        if (hMin !== "" || hMax !== "") hRules.push({ min: hMin === "" ? -Infinity : Number(hMin), max: hMax === "" ? Infinity : Number(hMax), pre: document.getElementById(`hPre_${i}`).value, suf: document.getElementById(`hSuf_${i}`).value, col: document.getElementById(`hCol_${i}`).value });
    }

    const pad = document.getElementById("zeroPadding").checked ? Math.max(Math.floor(min).toString().length, Math.floor(max).toString().length) : 0;
    const group = document.getElementById("groupDuplicates").checked;
    let items = [];
    if (group) {
        const f = {}; results.forEach(v => f[v] = (f[v] || 0) + 1);
        items = Object.entries(f).map(([v, c]) => ({ v: Number(v), c }));
        if (sort === "asc") items.sort((a, b) => a.v - b.v); else if (sort === "desc") items.sort((a, b) => b.v - a.v);
    } else {
        items = results.map(v => ({ v, c: 1 }));
    }

    const tags = items.map(i => {
        let p = document.getElementById("prefix").value, s = document.getElementById("suffix").value, st = "";
        let classList = ["tag"];
        
        if (i.v === actualMin) classList.push("min-tag");
        if (i.v === actualMax) classList.push("max-tag");

        for (let r of hRules) { 
            if (i.v >= r.min && i.v <= r.max) { 
                p = r.pre + p; s = s + r.suf; 
                const rgb = parseInt(r.col.slice(1,3),16)+","+parseInt(r.col.slice(3,5),16)+","+parseInt(r.col.slice(5,7),16); 
                st = `--h-col:${r.col};--h-bg:rgba(${rgb},0.15);--h-glow:rgba(${rgb},0.3);`; 
                classList.push("custom-highlight");
                break; 
            } 
        }
        const f = isDec ? i.v.toFixed(prec) : i.v.toString().padStart(pad, '0');
        return `<span class="${classList.join(' ')}" style="${st}">${p}${f}${s}${i.c > 1 ? ' (x'+i.c+')' : ''}</span>`;
    }).join('');

    const t = translations[currentLanguage];
    resDiv.innerHTML = `<div class="stats"><div><strong>${t.generated}</strong>${results.length}</div><div><strong>${t.sum}</strong>${results.reduce((a,b)=>a+b,0).toLocaleString()}</div><div><strong>${t.average}</strong>${(results.reduce((a,b)=>a+b,0)/results.length || 0).toFixed(prec)}</div></div><div class="result-tags">${tags}</div>`;
}

window.onload = () => { initHighlightInputs(); initSlots(); loadSettings(true); setLanguage('ja'); };

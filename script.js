let oreData = [];
let armortype = {};
let weapontype = {};

// Fetch ores.json
fetch('./ores.json')
    .then(res => res.json())
    .then(data => {
        oreData = data.ores;
        populateSelects(oreData);
    })
    .catch(err => console.error("Failed to load ores.json:", err));

// Fetch armortype.json
fetch('./armortype.json')
    .then(res => res.json())
    .then(data => armortype = data)
    .catch(err => console.error("Failed to load armortype.json:", err));

// Fetch weapontype.json
fetch('./weapontype.json')
    .then(res => res.json())
    .then(data => weapontype = data)
    .catch(err => console.error("Failed to load weapontype.json:", err));

// Populate ore dropdowns
function populateSelects(ores) {
    const selects = document.querySelectorAll(".ore-select");
    selects.forEach(select => {
        select.innerHTML = '<option value="">Select Ore</option>';
        ores.forEach(ore => {
            const option = document.createElement("option");
            option.value = ore.name;
            option.textContent = ore.name;
            select.appendChild(option);
        });
    });
}

// --- Helper: Determine craftable weapon/armor dynamically from JSON ---
function getCraftableFromJSON(craftingJSON, total) {
    const keys = Object.keys(craftingJSON).map(k => parseInt(k)).sort((a,b) => a-b);
    let selectedKey = keys[0];
    for (let k of keys) {
        if (k <= total) selectedKey = k;
        else break;
    }
    return craftingJSON[selectedKey];
}

// Calculate button
document.getElementById("calculate-btn").onclick = () => {
    const oreSelects = document.querySelectorAll(".ore-select");
    const oreAmounts = document.querySelectorAll(".ore-amount");

    let ores = {};
    let totalAmount = 0;
    let totalMultiplier = 0;
    let oreTypesUsed = 0;
    let overallTraits = [];

    // Collect ore data
    for (let i = 0; i < oreSelects.length; i++) {
        let oreName = oreSelects[i].value;
        let amount = parseFloat(oreAmounts[i].value) || 0;

        if (oreName && amount > 0) {
            totalAmount += amount;
            if (!ores[oreName]) {
                ores[oreName] = { amount: 0, multiplier: 0, trait: "" };
                oreTypesUsed++;
            }

            let oreDataItem = oreData.find(o => o.name === oreName);
            let multiplier = oreDataItem ? oreDataItem.multiplier : 0;
            let trait = oreDataItem ? oreDataItem.trait : "None";

            ores[oreName].amount += amount;
            ores[oreName].multiplier = multiplier;
            ores[oreName].trait = trait;

            if (!ores[oreName].counted) {
                totalMultiplier += multiplier;
                ores[oreName].counted = true;
            }

            if (trait !== "None" && !ores[oreName].traitCounted) {
                overallTraits.push(`${oreName}: ${trait}`);
                ores[oreName].traitCounted = true;
            }
        }
    }

    // --- Determine craftable weapon/armor dynamically from JSON ---
    let weaponCraftData = getCraftableFromJSON(weapontype.crafting_weapon_by_ore, totalAmount);
    let weaponType = weaponCraftData ? weaponCraftData.item : "None";
    let weaponChance = weaponCraftData ? weaponCraftData.chance : 0;

    let armorCraftData = getCraftableFromJSON(armortype.crafting_armor_by_ore, totalAmount);
    let armorTypeName = armorCraftData ? armorCraftData.item : "None";
    let armorChance = armorCraftData ? armorCraftData.chance : 0;

    // Update UI with type names
    document.getElementById("weapon-result").textContent = weaponType;
    document.getElementById("armor-result").textContent = armorTypeName;

    // Display detailed weapon variants
    const weaponBox = document.getElementById("weapon-stats");
    weaponBox.innerHTML = weaponType !== "None" && weapontype[weaponType]
        ? `<h4>${weaponType} Variants:</h4>` + weapontype[weaponType].map(w => `
            <p>
                <b>${w.name}</b> (Chance: ${w.chance})<br>
                Damage: ${w.damage}<br>
                Speed: ${w.speed}s<br>
                Range: ${w.range}<br>
                Price: ${w.price}g
            </p>
        `).join('')
        : "<p>No weapon variants available</p>";

    // Display detailed armor variants
    const armorBox = document.getElementById("armor-stats");
    armorBox.innerHTML = armorTypeName !== "None" && armortype[armorTypeName]
        ? `<h4>${armorTypeName} Variants:</h4>` + armortype[armorTypeName].map(a => `
            <p>
                <b>${a.name}</b> (Chance: ${a.chance})<br>
                Health: +${a.health}%<br>
                Price: ${a.price}$
            </p>
        `).join('')
        : "<p>No armor variants available</p>";

    // Suggested extras (~balance 30%)
    let balancedExtras = {};
    for (let ore in ores) balancedExtras[ore] = 0;

    let changed = true;
    while (changed) {
        changed = false;
        let tempTotal = 0;
        for (let ore in ores) tempTotal += ores[ore].amount + balancedExtras[ore];

        let percentages = {};
        for (let ore in ores) percentages[ore] = (ores[ore].amount + balancedExtras[ore]) / tempTotal;

        for (let donor in ores) {
            if (percentages[donor] > 0.30) {
                let under30 = Object.keys(ores).filter(o => percentages[o] < 0.30);
                if (under30.length === 0) continue;

                for (let receiver of under30) {
                    let donorAmount = ores[donor].amount + balancedExtras[donor];
                    if ((donorAmount - 1) / tempTotal >= 0.30) {
                        balancedExtras[donor] -= 1;
                        balancedExtras[receiver] += 1;
                        changed = true;
                        break;
                    }
                }
            }
        }
    }

    // Display Ore Breakdown
    const resultBox = document.getElementById("results");
    resultBox.innerHTML = ""; // Clear previous
    let originalTotal = totalAmount;

    for (let ore in ores) {
        let originalAmount = ores[ore].amount; 
        let suggested = balancedExtras[ore] || 0;
        let pct = (originalAmount / originalTotal) * 100; 
        let status = pct >= 30 ? `<span class='maxed'>MAXED (${pct.toFixed(1)}% Traits Maxed)</span>` 
                     : pct >= 10 ? `<span class='check-good'>✔ (${pct.toFixed(1)}% Traits available)</span>` 
                     : `${pct.toFixed(1)}%`;

        resultBox.innerHTML += `
            <p>
                <b>${ore}</b>: ${status}<br>
                Current: ${originalAmount} + Suggested Extra: ${suggested}<br>
                Multiplier: ${ores[ore].multiplier}x
                ${ores[ore].trait !== "None" ? `<br>Trait: ${ores[ore].trait}` : ""}
            </p>
        `;
    }

    // Overall multiplier & traits
    let overallMultiplier = oreTypesUsed ? (totalMultiplier / oreTypesUsed) : 0;
    resultBox.innerHTML += `<p><b>Overall Multiplier:</b> ${overallMultiplier.toFixed(2)}x</p>`;
    resultBox.innerHTML += `<p><b>Overall Traits:</b><br>${overallTraits.length ? overallTraits.map(t => "- " + t).join("<br>") : "-"}</p>`;
};

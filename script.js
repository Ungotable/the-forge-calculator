let oreData = [];
let armortype = {};
let weapontype = {};
let armorCraftData = {};

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

// Fetch armor_by_ore.json
fetch('./armor_by_ore.json')
    .then(res => res.json())
    .then(data => armorCraftData = data.crafting_armor_by_ore)
    .catch(err => console.error("Failed to load armor_by_ore.json:", err));

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

document.getElementById("calculate-btn").onclick = () => {
    const oreSelects = document.querySelectorAll(".ore-select");
    const oreAmounts = document.querySelectorAll(".ore-amount");

    let ores = {};
    let totalAmount = 0;
    let totalMultiplier = 0;
    let oreTypesUsed = 0;
    let overallTraits = [];

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

    let weaponType = "None";
    if (totalAmount >= 15) weaponType = "Colossal Swords";
    else if (totalAmount >= 10) weaponType = "Great Swords";
    else if (totalAmount >= 5) weaponType = "Straight Swords";
    else if (totalAmount >= 1) weaponType = "Daggers";

    let armorItem = "None";
    let armorChance = "-";
    if (armorCraftData[totalAmount]) {
        armorItem = armorCraftData[totalAmount].item;
        armorChance = armorCraftData[totalAmount].chance;
    } else {
        let keys = Object.keys(armorCraftData).map(k => parseInt(k)).sort((a,b) => a-b);
        for (let k of keys.reverse()) {
            if (totalAmount >= k) {
                armorItem = armorCraftData[k].item;
                armorChance = armorCraftData[k].chance;
                break;
            }
        }
    }

    let weaponChance = "-";
    if (weapontype[weaponType] && weapontype[weaponType].length > 0) {
        weaponChance = weapontype[weaponType][0].chance;
    }

    document.getElementById("armor-result").textContent = `${armorItem} (${armorChance}%)`;
    document.getElementById("weapon-result").textContent = `${weaponType} (${weaponChance}%)`;

    const weaponBox = document.getElementById("weapon-stats");
    if (weapontype[weaponType]) {
        weaponBox.innerHTML = `<h4>${weaponType} Variants:</h4>` + weapontype[weaponType].map(w => `
            <p>
                <b>${w.name}</b> (Chance: ${w.chance}%)<br>
                Damage: ${w.damage}<br>
                Speed: ${w.speed}s<br>
                Range: ${w.range}<br>
                Price: ${w.price}g
            </p>
        `).join('');
    } else weaponBox.innerHTML = "<p>No weapon variants available</p>";

    const armorBox = document.getElementById("armor-stats");
    if (armortype[armorItem]) {
        armorBox.innerHTML = `<h4>${armorItem} Variants:</h4>` + armortype[armorItem].map(a => `
            <p>
                <b>${a.name}</b> (Chance: ${a.chance}%)<br>
                Health: +${a.health}%<br>
                Price: ${a.price}$
            </p>
        `).join('');
    } else armorBox.innerHTML = "<p>No armor variants available</p>";

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
                    let receiverAmount = ores[receiver].amount + balancedExtras[receiver];
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

    let resultBox = document.getElementById("results");
    let originalTotal = totalAmount;
    resultBox.innerHTML = "";
    for (let ore in ores) {
        let originalAmount = ores[ore].amount; 
        let suggested = balancedExtras[ore] || 0;
        let pct = (originalAmount / originalTotal) * 100; 
        let status = "";
        if (pct >= 30) status = `<span class='maxed'>MAXED (${pct.toFixed(1)}% Traits Maxed)</span>`;
        else if (pct >= 10) status = `<span class='check-good'>✔ (${pct.toFixed(1)}% Traits available)</span>`;
        else status = `${pct.toFixed(1)}%`;
        resultBox.innerHTML += `
            <p>
                <b>${ore}</b>: ${status}<br>
                Current: ${originalAmount} + Suggested Extra: ${suggested}<br>
                Multiplier: ${ores[ore].multiplier}x
                ${ores[ore].trait !== "None" ? `<br>Trait: ${ores[ore].trait}` : ""}
            </p>
        `;
    }

    let overallMultiplier = oreTypesUsed ? (totalMultiplier / oreTypesUsed) : 0;
    resultBox.innerHTML += `<p><b>Overall Multiplier:</b> ${overallMultiplier.toFixed(2)}x</p>`;
    resultBox.innerHTML += `<p><b>Overall Traits:</b><br>${overallTraits.length ? overallTraits.map(t => "- " + t).join("<br>") : "-"}</p>`;
};

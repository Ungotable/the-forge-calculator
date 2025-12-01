let oreData = [];
let armorsData = {};
let weaponsData = {};

// Fetch ores.json
fetch('./ores.json')
    .then(res => res.json())
    .then(data => {
        oreData = data.ores;
        window.oreData = oreData;
        populateSelects(oreData);
    })
    .catch(err => console.error("Failed to load ores.json:", err));

// Fetch armors.json
fetch('./armors.json')
    .then(res => res.json())
    .then(data => armorsData = data.crafting_armor_by_ore)
    .catch(err => console.error("Failed to load armors.json:", err));

// Fetch weapons.json
fetch('./weapons.json')
    .then(res => res.json())
    .then(data => weaponsData = data.crafting_weapon_by_ore)
    .catch(err => console.error("Failed to load weapons.json:", err));

// Populate all ore <select> dropdowns
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

// Calculate button logic
document.getElementById("calculate-btn").onclick = () => {
    const oreSelects = document.querySelectorAll(".ore-select");
    const oreAmounts = document.querySelectorAll(".ore-amount");

    let totalOre = 0;
    let ores = {};

    // Collect ore data
    for (let i = 0; i < oreSelects.length; i++) {
        let oreName = oreSelects[i].value;
        let amount = parseFloat(oreAmounts[i].value) || 0;

        if (oreName !== "" && amount > 0) {
            totalOre += amount;

            if (!ores[oreName]) ores[oreName] = { amount: 0 };
            ores[oreName].amount += amount;
        }
    }

    // Determine Armor Type
    let armorKeys = Object.keys(armorsData).map(k => parseInt(k)).filter(k => k <= totalOre);
    let armor = armorKeys.length ? armorsData[Math.max(...armorKeys)] : { item: "None", chance: 0, health: 0 };

    // Determine Weapon Type
    let weaponKeys = Object.keys(weaponsData).map(k => parseInt(k)).filter(k => k <= totalOre);
    let weapon = weaponKeys.length ? weaponsData[Math.max(...weaponKeys)] : { item: "None", chance: 0, damage: 0, speed: 0 };

    // Update left side
    document.getElementById("weapon-result").textContent = `${weapon.item} ${weapon.chance}%`;
    document.getElementById("armor-result").textContent = `${armor.item} ${armor.chance}%`;

    // Display stats on the right
    const statsResult = document.getElementById("stats-result");
    let statsHtml = "";

    if (weapon.item !== "None") {
        statsHtml += `<p><b>Weapon Stats:</b></p>`;
        statsHtml += `<p>Damage: ${weapon.damage}</p>`;
        statsHtml += `<p>Speed: ${weapon.speed}</p>`;
        statsHtml += `<p>Chance: ${weapon.chance}/?</p>`;
    }

    if (armor.item !== "None") {
        statsHtml += `<p><b>Armor Stats:</b></p>`;
        statsHtml += `<p>Health: ${armor.health}</p>`;
        statsHtml += `<p>Chance: ${armor.chance}/?</p>`;
    }

    statsResult.innerHTML = statsHtml;

    // Continue displaying ore breakdown (optional)
    const resultBox = document.getElementById("results");
    resultBox.innerHTML = "";
    for (let ore in ores) {
        let currentPct = totalOre > 0 ? (ores[ore].amount / totalOre) * 100 : 0;
        let neededPct = Math.max(0, 30 - currentPct);

        let status = currentPct >= 30
            ? `<span class='maxed'>MAXED (${currentPct.toFixed(1)}% Traits Maxed)</span>`
            : `<span class='check-good'>${currentPct.toFixed(1)}% Traits available - Need ${neededPct.toFixed(1)}% more to max</span>`;

        resultBox.innerHTML += `
            <p>
                <b>${ore}</b>: ${status}
            </p>
        `;
    }
};

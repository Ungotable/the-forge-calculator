document.getElementById("calculate-btn").onclick = () => {
    const oreSelects = document.querySelectorAll(".ore-select");
    const oreAmounts = document.querySelectorAll(".ore-amount");

    let ores = {};
    let totalAmount = 0;
    let totalMultiplier = 0;
    let oreTypesUsed = 0;

    // Collect ore data
    for (let i = 0; i < oreSelects.length; i++) {
        let oreName = oreSelects[i].value;
        let amount = parseFloat(oreAmounts[i].value) || 0;

        if (oreName !== "" && amount > 0) {
            totalAmount += amount;
            if (!ores[oreName]) {
                ores[oreName] = { amount: 0, multiplier: 0, trait: "" };
                oreTypesUsed++;
            }

            // Cap each ore amount to 4 for multiplier calculation
            let cappedAmount = Math.min(amount, 4);
            let oreData = window.oreData.find(o => o.name === oreName);
            let multiplier = oreData ? oreData.multiplier : 0;
            let trait = oreData ? oreData.trait : "None";

            ores[oreName].amount += amount;
            ores[oreName].multiplier = multiplier;
            ores[oreName].trait = trait;

            totalMultiplier += cappedAmount * multiplier;
        }
    }

    // Display results
    let resultBox = document.getElementById("results");
    resultBox.innerHTML = "";

    for (let ore in ores) {
        let pct = (ores[ore].amount / totalAmount) * 100;

        let status = "";
        if (pct > 30) status = `<span class='maxed'>MAXED (${pct.toFixed(1)}% Traits Maxed)</span>`;
        else if (pct > 10) status = `<span class='check-good'>✔ (${pct.toFixed(1)}% Traits available)</span>`;
        else status = `${pct.toFixed(1)}%`;

        // Optimal extra needed to reach ~33%
        let optimal = Math.ceil((totalAmount * 0.33) - ores[ore].amount);
        if (optimal < 0) optimal = 0;

        resultBox.innerHTML += `
            <p>
                <b>${ore}</b>: ${status}  
                <br>Optimal extra needed: ${optimal}
                <br>Multiplier: ${ores[ore].multiplier}x
                ${pct > 30 ? `<br>Trait: ${ores[ore].trait}` : ""}
            </p>
        `;
    }

    // Calculate overall multiplier
    let overallMultiplier = oreTypesUsed ? (totalMultiplier / oreTypesUsed) : 0;
    resultBox.innerHTML += `<p><b>Overall Multiplier:</b> ${overallMultiplier.toFixed(2)}x</p>`;

    // Weapon forging logic
    let weaponResult = document.getElementById("weapon-result");
    if (totalAmount <= 2) weaponResult.innerText = "Cannot Forge";
    else if (totalAmount === 3) weaponResult.innerText = "100% Dagger";
    else if (totalAmount === 4 || totalAmount === 5) weaponResult.innerText = "Straight Sword (chance)";
    else if (totalAmount === 6) weaponResult.innerText = "84% Straight Sword";
    else weaponResult.innerText = "Unknown";
};

// Load ore data
async function loadOres() {
    const response = await fetch("ores.json");
    const data = await response.json();
    window.oreData = data.ores; // make global for multiplier lookup

    const selects = document.querySelectorAll(".ore-select");

    selects.forEach(select => {
        // First option = "None"
        let noneOption = document.createElement("option");
        noneOption.value = "";
        noneOption.textContent = "None";
        select.appendChild(noneOption);

        // Populate ore list
        data.ores.forEach(ore => {
            let option = document.createElement("option");
            option.value = ore.name;
            option.textContent = ore.name;
            select.appendChild(option);
        });
    });
}

// load ore list on page start
loadOres();

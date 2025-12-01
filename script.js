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

            if (trait !== "None") overallTraits.push(`${oreName}: ${trait}`);
        }
    }

    // Calculate suggested extras to roughly balance percentages (~30%)
    let balancedExtras = {};
    let newTotal = totalAmount;

    for (let ore in ores) {
        let currentPct = ores[ore].amount / newTotal;
        let suggestedExtra = 0;
        const targetPct = 0.3;

        if (currentPct < targetPct) {
            suggestedExtra = Math.ceil((targetPct * newTotal - ores[ore].amount));
            if (suggestedExtra < 0) suggestedExtra = 0;
        }

        balancedExtras[ore] = suggestedExtra;
        newTotal += suggestedExtra;
    }

    // Display results
    let resultBox = document.getElementById("results");
    resultBox.innerHTML = "";

    for (let ore in ores) {
        let newAmount = ores[ore].amount + (balancedExtras[ore] || 0);
        let pct = (newAmount / newTotal) * 100;

        let status = "";
        if (pct > 30) status = `<span class='maxed'>MAXED (${pct.toFixed(1)}% Traits Maxed)</span>`;
        else if (pct > 10) status = `<span class='check-good'>✔ (${pct.toFixed(1)}% Traits available)</span>`;
        else status = `${pct.toFixed(1)}%`;

        resultBox.innerHTML += `
            <p>
                <b>${ore}</b>: ${status}<br>
                Current: ${ores[ore].amount} + Suggested Extra: ${balancedExtras[ore] || 0}<br>
                Multiplier: ${ores[ore].multiplier}x
                ${ores[ore].trait !== "None" ? `<br>Trait: ${ores[ore].trait}` : ""}
            </p>
        `;
    }

    // Overall multiplier
    let overallMultiplier = oreTypesUsed ? (totalMultiplier / oreTypesUsed) : 0;
    resultBox.innerHTML += `<p><b>Overall Multiplier:</b> ${overallMultiplier.toFixed(2)}x</p>`;

    // Overall traits
    resultBox.innerHTML += `<p><b>Overall Traits:</b><br>${overallTraits.length > 0 ? overallTraits.map(t => "- " + t).join("<br>") : "-"}</p>`;
};

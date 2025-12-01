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

    // Calculate % needed to max traits (~30%)
    let resultBox = document.getElementById("results");
    resultBox.innerHTML = "";

    for (let ore in ores) {
        let currentPct = (ores[ore].amount / totalAmount) * 100;
        let neededPct = Math.max(0, 30 - currentPct);

        let status = "";
        if (currentPct >= 30) {
            status = `<span class='maxed'>MAXED (${currentPct.toFixed(1)}% Traits Maxed)</span>`;
        } else {
            status = `<span class='check-good'>${currentPct.toFixed(1)}% Traits available - Need ${neededPct.toFixed(1)}% more to max</span>`;
        }

        resultBox.innerHTML += `
            <p>
                <b>${ore}</b>: ${status}<br>
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

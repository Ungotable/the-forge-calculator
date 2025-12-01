document.getElementById("calculate-btn").onclick = async () => {
    const oreSelects = document.querySelectorAll(".ore-select");
    const oreAmounts = document.querySelectorAll(".ore-amount");

    // Load ore data
    const response = await fetch("ores.json");
    const data = await response.json();
    const oreData = {};
    data.ores.forEach(o => oreData[o.name] = o);

    let ores = {};
    let totalAmount = 0;

    // Collect ore amounts
    for (let i = 0; i < oreSelects.length; i++) {
        const oreName = oreSelects[i].value;
        let amount = parseFloat(oreAmounts[i].value) || 0;

        if (oreName && amount > 0) {
            totalAmount += amount;
            ores[oreName] = (ores[oreName] || 0) + amount;
        }
    }

    const resultBox = document.getElementById("results");
    resultBox.innerHTML = "";

    let overallMultiplier = 0;

    for (let oreName in ores) {
        const ore = oreData[oreName];
        const amount = Math.min(ores[oreName], 4); // cap at 4
        const pct = (ores[oreName] / totalAmount) * 100;

        // Determine status
        let status = "";
        if (pct > 30) status = `<span class='maxed'>MAXED (${pct.toFixed(1)}% Traits Maxxed)</span>`;
        else if (pct > 10) status = `<span class='check-good'>✔ (${pct.toFixed(1)}% Traits available)</span>`;
        else status = `${pct.toFixed(1)}%`;

        // Optimal extra to reach 33%
        let optimal = Math.ceil((totalAmount * 0.33) - ores[oreName]);
        if (optimal < 0) optimal = 0;

        // Multiplier calculation
        const oreMultiplier = ore.multiplier * amount;
        overallMultiplier += oreMultiplier;

        resultBox.innerHTML += `
            <p>
                <b>${oreName}</b>: ${status}<br>
                Optimal extra needed: ${optimal}<br>
                ${pct > 30 && ore.trait ? `Trait: ${ore.trait}<br>` : ""}
                Multiplier: ${oreMultiplier.toFixed(2)}x
            </p>
        `;
    }

    resultBox.innerHTML += `<p><b>Overall Multiplier:</b> ${overallMultiplier.toFixed(2)}x</p>`;
};

document.getElementById("calculate-btn").onclick = () => {
    const oreSelects = document.querySelectorAll(".ore-select");
    const oreAmounts = document.querySelectorAll(".ore-amount");

    let ores = {};
    let totalAmount = 0;

    // Collect ore data
    for (let i = 0; i < oreSelects.length; i++) {
        let ore = oreSelects[i].value;
        let amount = parseFloat(oreAmounts[i].value) || 0;

        if (ore !== "" && amount > 0) {
            totalAmount += amount;
            ores[ore] = (ores[ore] || 0) + amount;
        }
    }

    // Calculate percentages
    let resultBox = document.getElementById("results");
    resultBox.innerHTML = "";

    for (let ore in ores) {
        let pct = (ores[ore] / totalAmount) * 100;

        let status = "";
        if (pct > 30) status = `<span class='maxed'>MAXED (${pct.toFixed(1)}%)</span>`;
        else if (pct > 10) status = `<span class='check-good'>✔ (${pct.toFixed(1)}%)</span>`;
        else status = `${pct.toFixed(1)}%`;

        // optimal for 30–33.3%
        let optimal = Math.ceil((totalAmount * 0.33) - ores[ore]);
        if (optimal < 0) optimal = 0;

        resultBox.innerHTML += `
            <p>
                <b>${ore}</b>: ${status}  
                <br>Optimal extra needed: ${optimal}
            </p>
        `;
    }

    // Weapon forging logic
    let weaponResult = document.getElementById("weapon-result");

    if (totalAmount <= 2) weaponResult.innerText = "Cannot Forge";
    else if (totalAmount === 3) weaponResult.innerText = "100% Dagger";
    else if (totalAmount === 4 || totalAmount === 5) weaponResult.innerText = "Straight Sword (chance)";
    else if (totalAmount === 6) weaponResult.innerText = "84% Straight Sword";
    else weaponResult.innerText = "Unknown";
};

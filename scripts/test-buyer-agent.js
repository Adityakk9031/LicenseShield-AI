const API_URL = 'http://localhost:3000/api/audit';

async function mockCapNegotiation(packages, projectLicense) {
    console.log(`[Buyer Agent] Negotiating CROO order with LicenseShield AI for security audit...`);
    console.log(`[Buyer Agent] Target packages: ${packages.map(p => p.name).join(', ')}`);
    
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ packages, projectLicense })
        });

        if (!response.ok) {
            throw new Error(`Failed to negotiate: HTTP ${response.status}`);
        }

        const verdict = await response.json();
        return verdict;
    } catch (err) {
        console.error(`[Buyer Agent] Communication error: ${err.message}`);
        process.exit(1);
    }
}

async function simulateInstallation() {
    console.log("=================================================");
    console.log("🤖 Coding Agent 'DevBot-9000' Installation Task");
    console.log("=================================================\n");

    const targetPackages = [
        { name: 'colors', version: '1.4.1', ecosystem: 'npm' }, // Known vulnerable version
        { name: 'minify-maven', ecosystem: 'npm' } // Fake / potentially unknown package
    ];

    console.log("[Buyer Agent] Planning to install new dependencies.");
    console.log("[Buyer Agent] Step 1: Consult LicenseShield AI via CROO Network.\n");

    // Invoke our LicenseShield AI endpoint acting as a CAP wrapper
    const verdict = await mockCapNegotiation(targetPackages, 'MIT');

    console.log("\n=================================================");
    console.log(`🛡️  LicenseShield AI Verdict: ${verdict.status}`);
    console.log("=================================================");
    
    if (verdict.capTransaction) {
        console.log(`[CROO] Order ID: ${verdict.capTransaction.orderId}`);
        console.log(`[CROO] Settled At: ${verdict.capTransaction.settledAt}`);
    }

    if (verdict.status === 'APPROVED') {
        console.log("\n[Buyer Agent] No risks detected. Proceeding with installation...");
        console.log("[Buyer Agent] > npm install colors minify-maven");
        console.log("[Buyer Agent] ✅ Installation successful.");
    } else {
        console.log(`\n[Buyer Agent] 🚨 WARNING: Installation aborted due to detected risks!`);
        console.log("[Buyer Agent] Risk Breakdown:");
        verdict.risks.forEach((risk, idx) => {
            console.log(`  ${idx + 1}. [${risk.severity}] ${risk.package} (${risk.type}) - ${risk.detail}`);
        });
        console.log("\n[Buyer Agent] 🛑 Agent halted to prevent system compromise or license violation.");
    }
}

simulateInstallation();

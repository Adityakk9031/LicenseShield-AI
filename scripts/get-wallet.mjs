import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';

// Load .env variables manually to avoid needing dotenv dependency
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            process.env[match[1].trim()] = match[2].trim();
        }
    });
}

const privateKey = process.env.PRIVATE_KEY;
const rpcUrl = process.env.RPC;

if (!privateKey) {
    console.error("No PRIVATE_KEY found in .env");
    process.exit(1);
}

try {
    const provider = new ethers.JsonRpcProvider(rpcUrl || 'https://sepolia.base.org');
    const signer = new ethers.Wallet(privateKey, provider);
    
    console.log("====================================================");
    console.log("💳 Agent Controller / Signer EOA:", signer.address);
    console.log("====================================================");
    
    // Note: To derive the actual ERC-4337 Smart Wallet address, you typically
    // need to know the specific Factory contract address and salt being used 
    // by your AA Provider (e.g., Coinbase Smart Wallet, Biconomy, ZeroDev).
    // For now, this prints the Signer/EOA address that controls the smart wallet.
    // If you are using a standard SimpleAccountFactory, you can calculate the
    // counterfactual address using the factory's `getAddress(owner, salt)` method.
    
    console.log(`\nTo request testnet tokens on Base Sepolia, visit a faucet and enter the address above.`);
    console.log(`E.g., https://faucet.quicknode.com/base/sepolia`);
    
} catch (error) {
    console.error("Error generating wallet:", error.message);
}

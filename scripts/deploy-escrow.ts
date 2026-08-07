import solc from 'solc';
import * as fs from 'fs';
import * as path from 'path';
import { ethers } from 'ethers';
import * as dotenv from 'dotenv';

dotenv.config();

function findImports(importPath: string) {
  try {
    if (importPath.startsWith('@openzeppelin/')) {
      const fullPath = path.resolve(__dirname, '../node_modules', importPath);
      return { contents: fs.readFileSync(fullPath, 'utf8') };
    }
    const localPath = path.resolve(__dirname, '../contracts', importPath);
    return { contents: fs.readFileSync(localPath, 'utf8') };
  } catch (e: any) {
    return { error: `File not found: ${importPath}` };
  }
}

export function compileContract() {
  const contractPath = path.resolve(__dirname, '../contracts/LicenseShieldEscrow.sol');
  const source = fs.readFileSync(contractPath, 'utf8');

  const input = {
    language: 'Solidity',
    sources: {
      'LicenseShieldEscrow.sol': {
        content: source,
      },
    },
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      outputSelection: {
        '*': {
          '*': ['abi', 'evm.bytecode'],
        },
      },
    },
  };

  const output = JSON.parse(solc.compile(JSON.stringify(input), { import: findImports }));
  if (output.errors) {
    const errors = output.errors.filter((e: any) => e.severity === 'error');
    if (errors.length > 0) {
      throw new Error(`Solidity compilation errors:\n${errors.map((e: any) => e.formattedMessage).join('\n')}`);
    }
  }

  const contract = output.contracts['LicenseShieldEscrow.sol']['LicenseShieldEscrow'];
  return {
    abi: contract.abi,
    bytecode: contract.evm.bytecode.object,
  };
}

async function deploy() {
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('PRIVATE_KEY environment variable is required');
  }

  const rpcUrl = process.env.RPC || 'https://sepolia.base.org';
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);

  console.log('Deploying LicenseShieldEscrow with wallet address:', wallet.address);

  const BASE_SEPOLIA_USDC = ethers.getAddress('0x036CbD53842c5426634e7929541eC2318f3dCF7e');
  const INITIAL_FEE = 10000; // 0.01 USDC (6 decimals)
  const rawTreasury = process.env.TREASURY_WALLET_ADDRESS || wallet.address;
  const treasuryWallet = ethers.getAddress(rawTreasury.toLowerCase());



  console.log('USDC Address:', BASE_SEPOLIA_USDC);
  console.log('Treasury Wallet:', treasuryWallet);
  console.log('Initial Fee:', INITIAL_FEE, '(0.01 USDC)');

  console.log('Compiling LicenseShieldEscrow.sol...');
  const { abi, bytecode } = compileContract();

  const factory = new ethers.ContractFactory(abi, bytecode, wallet);
  console.log('Sending deployment transaction to Base Sepolia...');

  const contract = await factory.deploy(BASE_SEPOLIA_USDC, treasuryWallet, INITIAL_FEE);
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  console.log('✅ LicenseShieldEscrow deployed successfully to Base Sepolia!');
  console.log('Contract Address:', contractAddress);

  // Update .env file with ESCROW_CONTRACT_ADDRESS
  const envPath = path.resolve(__dirname, '../.env');
  if (fs.existsSync(envPath)) {
    let envContent = fs.readFileSync(envPath, 'utf-8');
    if (envContent.includes('ESCROW_CONTRACT_ADDRESS=')) {
      envContent = envContent.replace(/ESCROW_CONTRACT_ADDRESS=.*/g, `ESCROW_CONTRACT_ADDRESS=${contractAddress}`);
    } else {
      envContent += `\nESCROW_CONTRACT_ADDRESS=${contractAddress}\n`;
    }
    fs.writeFileSync(envPath, envContent);
    console.log('Updated .env file with ESCROW_CONTRACT_ADDRESS');
  }
}

if (require.main === module) {
  deploy().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

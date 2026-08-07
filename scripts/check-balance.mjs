import { ethers } from 'ethers';

const TARGET_WALLET = '0x4a47a96499729664190734449210F218908F9965';
const RPC_URL = 'https://sepolia.base.org';
const USDC_ADDRESS = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';

const erc20Abi = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)'
];

async function main() {
  console.log(`Checking balances for wallet: ${TARGET_WALLET}`);
  const provider = new ethers.JsonRpcProvider(RPC_URL);

  try {
    // 1. Check Native ETH
    const ethBalance = await provider.getBalance(TARGET_WALLET);
    console.log(`Native ETH Balance: ${ethers.formatEther(ethBalance)} ETH`);

    // 2. Check USDC
    const usdcContract = new ethers.Contract(USDC_ADDRESS, erc20Abi, provider);
    const usdcDecimals = await usdcContract.decimals();
    const usdcBalance = await usdcContract.balanceOf(TARGET_WALLET);
    const usdcSymbol = await usdcContract.symbol();
    
    console.log(`${usdcSymbol} Balance: ${ethers.formatUnits(usdcBalance, usdcDecimals)} ${usdcSymbol}`);
  } catch (err) {
    console.error('Error fetching balance:', err);
  }
}

main();

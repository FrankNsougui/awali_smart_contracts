const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying Awali smart contracts...");

  /*// 1. Deploy WAL
  const WAL = await hre.ethers.getContractFactory("WAL");
  const wal = await WAL.deploy("Awali Liquidity Token", "WAL");
  console.log("WAL deployed at:", wal.address);

  // 2. Deploy FeeDistributor
  const FeeDistributor = await hre.ethers.getContractFactory("FeeDistributor");
  const distributor = await FeeDistributor.deploy();
  console.log("FeeDistributor deployed at:", distributor.address);

  // 3. Deploy SwapReceiver
  const SwapReceiver = await hre.ethers.getContractFactory("SwapReceiver");
  const receiver = await SwapReceiver.deploy();
  console.log("SwapReceiver deployed at:", receiver.address);

  // 4. Deploy PoolFactory
  const PoolFactory = await hre.ethers.getContractFactory("PoolFactory");
  const factory = await PoolFactory.deploy();
  console.log("PoolFactory deployed at:", factory.address);

  // OPTIONAL: create initial USDT pool (mock address)
  const TOKEN_ADDRESS = "0xA3fDF8255a712c96F03D13649710024f95552d12"; // replace with real ERC20
  
  const tx = await factory.createPool(TOKEN_ADDRESS, "USDT-Ethereum Pool");
  await tx.wait();
  const poolAddr = await factory.tokenToPool(TOKEN_ADDRESS);

  console.log("USDT Pool created at:", poolAddr);

  console.log("🎉 All contracts deployed successfully!");*/

   // 1. Deploy USDC Faucets
   const USDCFaucets = await hre.ethers.getContractFactory("USDCFaucet");
   const usdc = await USDCFaucets.deploy();
   console.log("USDC deployed at:", usdc.address);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

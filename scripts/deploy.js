const hre = require("hardhat");

async function main() {
  console.log("Deploying Awali smart contracts...");

  // 1. Deploy WAL
  const WAL = await hre.ethers.getContractFactory("WAL");
  const wal = await WAL.deploy("Awali Liquidity Token", "WAL");
  await wal.deployed();
  console.log("WAL deployed at:", wal.address);

  // 2. Deploy FeeDistributor
  const FeeDistributor = await hre.ethers.getContractFactory("FeeDistributor");
  const distributor = await FeeDistributor.deploy();
  await distributor.deployed();
  console.log("FeeDistributor deployed at:", distributor.address);

  // 3. Deploy SwapReceiver
  const SwapReceiver = await hre.ethers.getContractFactory("SwapReceiver");
  const receiver = await SwapReceiver.deploy();
  await receiver.deployed();
  console.log("SwapReceiver deployed at:", receiver.address);

  console.log("All contracts deployed successfully!");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

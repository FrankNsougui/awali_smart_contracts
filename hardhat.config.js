require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const DEPLOYER_KEY = process.env.DEPLOYER_PRIVATE_KEY || "0267bd35f1f5d420d9cc7236c26057d380ba5774642fa3946789c6452ee83629";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      evmVersion: "london",
    },
  },
  networks: {
    // ── Ethereum ──
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || 'https://rpc.ankr.com/eth_sepolia/147459688186582367c6f4876b410fdae21acd12183780741e08c700b0ad2e0b',
      accounts: [`0x${DEPLOYER_KEY}`],
      chainId: 11155111,
    },

    // ── Polygon ──
    polygonAmoy: {
      url: process.env.POLYGON_AMOY_RPC_URL || 'https://rpc-amoy.polygon.technology',
      accounts: [`0x${DEPLOYER_KEY}`],
      chainId: 80002,
    },

    // ── Arbitrum ──
    arbitrumSepolia: {
      url: process.env.ARBITRUM_SEPOLIA_RPC_URL || 'https://sepolia-rollup.arbitrum.io/rpc',
      accounts: [`0x${DEPLOYER_KEY}`],
      chainId: 421614,
    },

    // ── Base ──
    baseSepolia: {
      url: process.env.BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org',
      accounts: [`0x${DEPLOYER_KEY}`],
      chainId: 84532,
    },

    // ── BNB Chain ──
    bscTestnet: {
      url: process.env.BSC_TESTNET_RPC_URL || 'https://data-seed-prebsc-1-s1.binance.org:8545',
      accounts: [`0x${DEPLOYER_KEY}`],
      chainId: 97,
    },

    // ── Linea ──
    lineaSepolia: {
      url: process.env.LINEA_SEPOLIA_RPC_URL || 'https://rpc.sepolia.linea.build',
      accounts: [`0x${DEPLOYER_KEY}`],
      chainId: 59141,
    },
  },
};

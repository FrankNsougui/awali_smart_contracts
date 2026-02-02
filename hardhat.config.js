require("@nomicfoundation/hardhat-toolbox");
/** @type import('hardhat/config').HardhatUserConfig */

const Private_Key = "0267bd35f1f5d420d9cc7236c26057d380ba5774642fa3946789c6452ee83629"

module.exports = {
  solidity: "0.8.20",
  networks: {
    /*hardhat: {
       chainId: 1337
    },*/
    sepolia: {
       url: 'https://rpc.ankr.com/eth_sepolia/147459688186582367c6f4876b410fdae21acd12183780741e08c700b0ad2e0b',
       accounts: [`0x${Private_Key}`]
    }
   }
};

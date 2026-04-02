const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("USDCFaucet", function () {
  async function deployFixture() {
    const [deployer, other] = await ethers.getSigners();

    const USDC = await ethers.getContractFactory("USDCFaucet");
    const usdc = await USDC.deploy();
    await usdc.deployed();

    return { usdc, deployer, other };
  }

  describe("decimals", function () {
    it("should return 6", async function () {
      const { usdc } = await loadFixture(deployFixture);
      expect(await usdc.decimals()).to.equal(6);
    });
  });

  describe("mint", function () {
    it("should allow minter role to mint tokens", async function () {
      const { usdc, deployer, other } = await loadFixture(deployFixture);
      const amount = ethers.utils.parseUnits("1000", 6);

      await usdc.connect(deployer).mint(other.address, amount);
      expect(await usdc.balanceOf(other.address)).to.equal(amount);
    });

    it("should revert if caller does not have minter role", async function () {
      const { usdc, other } = await loadFixture(deployFixture);
      const amount = ethers.utils.parseUnits("1000", 6);

      await expect(
        usdc.connect(other).mint(other.address, amount)
      ).to.be.reverted;
    });
  });

  describe("roles", function () {
    it("deployer should have DEFAULT_ADMIN_ROLE and MINTER_ROLE", async function () {
      const { usdc, deployer } = await loadFixture(deployFixture);
      const DEFAULT_ADMIN = ethers.constants.HashZero;
      const MINTER_ROLE = await usdc.MINTER_ROLE();

      expect(await usdc.hasRole(DEFAULT_ADMIN, deployer.address)).to.be.true;
      expect(await usdc.hasRole(MINTER_ROLE, deployer.address)).to.be.true;
    });
  });
});

const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("PoolFactory", function () {
  async function deployFixture() {
    const [owner, other] = await ethers.getSigners();

    const USDC = await ethers.getContractFactory("USDCFaucet");
    const usdc = await USDC.deploy();
    await usdc.deployed();

    const Factory = await ethers.getContractFactory("PoolFactory");
    const factory = await Factory.deploy();
    await factory.deployed();

    return { factory, usdc, owner, other };
  }

  describe("createPool", function () {
    it("should revert if caller is not owner", async function () {
      const { factory, usdc, other } = await loadFixture(deployFixture);
      await expect(
        factory.connect(other).createPool(usdc.address, "USDC Pool")
      ).to.be.reverted;
    });

    it("should revert if token address is zero", async function () {
      const { factory, owner } = await loadFixture(deployFixture);
      await expect(
        factory.connect(owner).createPool(ethers.constants.AddressZero, "Zero Pool")
      ).to.be.revertedWith("token=0");
    });

    it("should create pool and emit PoolCreated", async function () {
      const { factory, usdc, owner } = await loadFixture(deployFixture);

      await expect(factory.connect(owner).createPool(usdc.address, "USDC Pool"))
        .to.emit(factory, "PoolCreated");
    });

    it("should revert if pool already exists for token", async function () {
      const { factory, usdc, owner } = await loadFixture(deployFixture);

      await factory.connect(owner).createPool(usdc.address, "USDC Pool");
      await expect(
        factory.connect(owner).createPool(usdc.address, "USDC Pool 2")
      ).to.be.revertedWith("exists");
    });
  });

  describe("tokenToPool mapping", function () {
    it("should return zero address for unmapped token", async function () {
      const { factory, usdc } = await loadFixture(deployFixture);
      expect(await factory.tokenToPool(usdc.address)).to.equal(ethers.constants.AddressZero);
    });

    it("should return correct pool address after creation", async function () {
      const { factory, usdc, owner } = await loadFixture(deployFixture);

      await factory.connect(owner).createPool(usdc.address, "USDC Pool");

      const poolAddr = await factory.tokenToPool(usdc.address);
      expect(poolAddr).to.not.equal(ethers.constants.AddressZero);
    });
  });
});

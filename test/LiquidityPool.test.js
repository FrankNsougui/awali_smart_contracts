const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("LiquidityPool", function () {
  async function deployFixture() {
    const [owner, provider, recipient] = await ethers.getSigners();

    const USDC = await ethers.getContractFactory("USDCFaucet");
    const usdc = await USDC.deploy();
    await usdc.deployed();

    const Pool = await ethers.getContractFactory("LiquidityPool");
    const pool = await Pool.deploy(usdc.address, "USDC Pool");
    await pool.deployed();

    // Mint USDC to provider
    const mintAmount = ethers.utils.parseUnits("10000", 6);
    await usdc.mint(provider.address, mintAmount);

    return { pool, usdc, owner, provider, recipient, mintAmount };
  }

  describe("deposit", function () {
    it("should revert if amount is 0", async function () {
      const { pool, provider } = await loadFixture(deployFixture);
      const ref = ethers.utils.formatBytes32String("dep1");
      await expect(
        pool.connect(provider).deposit(0, ref)
      ).to.be.revertedWith("amount>0");
    });

    it("should transfer tokens and emit LiquidityAdded", async function () {
      const { pool, usdc, provider } = await loadFixture(deployFixture);
      const amount = ethers.utils.parseUnits("100", 6);
      const ref = ethers.utils.formatBytes32String("dep1");

      await usdc.connect(provider).approve(pool.address, amount);

      await expect(pool.connect(provider).deposit(amount, ref))
        .to.emit(pool, "LiquidityAdded")
        .withArgs(provider.address, amount, ref);
    });

    it("should increase pool balance after deposit", async function () {
      const { pool, usdc, provider } = await loadFixture(deployFixture);
      const amount = ethers.utils.parseUnits("500", 6);
      const ref = ethers.utils.formatBytes32String("dep2");

      await usdc.connect(provider).approve(pool.address, amount);
      await pool.connect(provider).deposit(amount, ref);

      expect(await pool.poolBalance()).to.equal(amount);
    });
  });

  describe("withdrawTo", function () {
    it("should revert if caller is not owner", async function () {
      const { pool, provider, recipient } = await loadFixture(deployFixture);
      const ref = ethers.utils.formatBytes32String("w1");
      await expect(
        pool.connect(provider).withdrawTo(recipient.address, 100, ref)
      ).to.be.reverted;
    });

    it("should transfer tokens to recipient and emit LiquidityRemoved", async function () {
      const { pool, usdc, owner, provider, recipient } = await loadFixture(deployFixture);
      const amount = ethers.utils.parseUnits("200", 6);
      const depRef = ethers.utils.formatBytes32String("dep");
      const wRef = ethers.utils.formatBytes32String("w1");

      await usdc.connect(provider).approve(pool.address, amount);
      await pool.connect(provider).deposit(amount, depRef);

      await expect(pool.connect(owner).withdrawTo(recipient.address, amount, wRef))
        .to.emit(pool, "LiquidityRemoved")
        .withArgs(recipient.address, amount, wRef);

      expect(await usdc.balanceOf(recipient.address)).to.equal(amount);
    });

    it("should revert if to address is zero", async function () {
      const { pool, owner } = await loadFixture(deployFixture);
      const ref = ethers.utils.formatBytes32String("w2");
      await expect(
        pool.connect(owner).withdrawTo(ethers.constants.AddressZero, 100, ref)
      ).to.be.revertedWith("to=0");
    });
  });

  describe("poolBalance", function () {
    it("should return 0 for empty pool", async function () {
      const { pool } = await loadFixture(deployFixture);
      expect(await pool.poolBalance()).to.equal(0);
    });

    it("should reflect correct balance after deposits and withdrawals", async function () {
      const { pool, usdc, owner, provider, recipient } = await loadFixture(deployFixture);
      const depositAmt = ethers.utils.parseUnits("1000", 6);
      const withdrawAmt = ethers.utils.parseUnits("300", 6);

      await usdc.connect(provider).approve(pool.address, depositAmt);
      await pool.connect(provider).deposit(depositAmt, ethers.utils.formatBytes32String("d"));
      await pool.connect(owner).withdrawTo(recipient.address, withdrawAmt, ethers.utils.formatBytes32String("w"));

      expect(await pool.poolBalance()).to.equal(depositAmt.sub(withdrawAmt));
    });
  });
});

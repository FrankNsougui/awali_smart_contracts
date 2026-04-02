const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("SwapReceiver", function () {
  async function deployFixture() {
    const [owner, user, poolAddr] = await ethers.getSigners();

    const USDC = await ethers.getContractFactory("USDCFaucet");
    const usdc = await USDC.deploy();
    await usdc.deployed();

    const Swap = await ethers.getContractFactory("SwapReceiver");
    const swap = await Swap.deploy();
    await swap.deployed();

    const mintAmount = ethers.utils.parseUnits("10000", 6);
    await usdc.mint(user.address, mintAmount);

    return { swap, usdc, owner, user, poolAddr, mintAmount };
  }

  describe("depositForSwap", function () {
    it("should revert if amount is 0", async function () {
      const { swap, usdc, user } = await loadFixture(deployFixture);
      const uid = ethers.utils.formatBytes32String("swap1");
      await expect(
        swap.connect(user).depositForSwap(uid, usdc.address, 0)
      ).to.be.revertedWith("amount>0");
    });

    it("should revert if swapUid is zero bytes", async function () {
      const { swap, usdc, user } = await loadFixture(deployFixture);
      await expect(
        swap.connect(user).depositForSwap(ethers.constants.HashZero, usdc.address, 100)
      ).to.be.revertedWith("swapUid required");
    });

    it("should transfer tokens and emit SwapDeposit", async function () {
      const { swap, usdc, user } = await loadFixture(deployFixture);
      const amount = ethers.utils.parseUnits("50", 6);
      const uid = ethers.utils.formatBytes32String("swap1");

      await usdc.connect(user).approve(swap.address, amount);

      await expect(swap.connect(user).depositForSwap(uid, usdc.address, amount))
        .to.emit(swap, "SwapDeposit");
    });
  });

  describe("releaseToPool", function () {
    it("should revert if caller is not owner", async function () {
      const { swap, usdc, user, poolAddr } = await loadFixture(deployFixture);
      const ref = ethers.utils.formatBytes32String("rel1");
      await expect(
        swap.connect(user).releaseToPool(usdc.address, poolAddr.address, 100, ref)
      ).to.be.reverted;
    });

    it("should transfer tokens to pool address", async function () {
      const { swap, usdc, owner, user, poolAddr } = await loadFixture(deployFixture);
      const amount = ethers.utils.parseUnits("100", 6);
      const uid = ethers.utils.formatBytes32String("swap1");
      const ref = ethers.utils.formatBytes32String("rel1");

      await usdc.connect(user).approve(swap.address, amount);
      await swap.connect(user).depositForSwap(uid, usdc.address, amount);

      await swap.connect(owner).releaseToPool(usdc.address, poolAddr.address, amount, ref);

      expect(await usdc.balanceOf(poolAddr.address)).to.equal(amount);
    });

    it("should revert if pool address is zero", async function () {
      const { swap, usdc, owner } = await loadFixture(deployFixture);
      const ref = ethers.utils.formatBytes32String("rel2");
      await expect(
        swap.connect(owner).releaseToPool(usdc.address, ethers.constants.AddressZero, 100, ref)
      ).to.be.revertedWith("pool=0");
    });
  });

  describe("rescueERC20", function () {
    it("should allow owner to rescue stuck tokens", async function () {
      const { swap, usdc, owner, user } = await loadFixture(deployFixture);
      const amount = ethers.utils.parseUnits("75", 6);
      const uid = ethers.utils.formatBytes32String("swap2");

      await usdc.connect(user).approve(swap.address, amount);
      await swap.connect(user).depositForSwap(uid, usdc.address, amount);

      await swap.connect(owner).rescueERC20(usdc.address, owner.address, amount);
      expect(await usdc.balanceOf(owner.address)).to.equal(amount);
    });

    it("should revert if caller is not owner", async function () {
      const { swap, usdc, user } = await loadFixture(deployFixture);
      await expect(
        swap.connect(user).rescueERC20(usdc.address, user.address, 100)
      ).to.be.reverted;
    });
  });
});

const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("FeeDistributor", function () {
  async function deployFixture() {
    const [owner, recipient1, recipient2, other] = await ethers.getSigners();

    const USDC = await ethers.getContractFactory("USDCFaucet");
    const usdc = await USDC.deploy();
    await usdc.deployed();

    const Dist = await ethers.getContractFactory("FeeDistributor");
    const distributor = await Dist.deploy();
    await distributor.deployed();

    return { distributor, usdc, owner, recipient1, recipient2, other };
  }

  async function fundedFixture() {
    const fixture = await deployFixture();
    const { distributor, usdc } = fixture;
    const fundAmount = ethers.utils.parseUnits("1000", 6);
    await usdc.mint(distributor.address, fundAmount);
    return { ...fixture, fundAmount };
  }

  describe("distributeERC20", function () {
    it("should revert if caller is not owner", async function () {
      const { distributor, usdc, other, recipient1 } = await loadFixture(fundedFixture);
      await expect(
        distributor.connect(other).distributeERC20(
          usdc.address,
          [recipient1.address],
          [100]
        )
      ).to.be.reverted;
    });

    it("should revert if array lengths mismatch", async function () {
      const { distributor, usdc, owner, recipient1, recipient2 } = await loadFixture(fundedFixture);
      await expect(
        distributor.connect(owner).distributeERC20(
          usdc.address,
          [recipient1.address, recipient2.address],
          [100]
        )
      ).to.be.revertedWith("len mismatch");
    });

    it("should revert if contract has insufficient balance", async function () {
      const { distributor, usdc, owner, recipient1 } = await loadFixture(deployFixture);
      await expect(
        distributor.connect(owner).distributeERC20(
          usdc.address,
          [recipient1.address],
          [ethers.utils.parseUnits("100", 6)]
        )
      ).to.be.revertedWith("insufficient contract balance");
    });

    it("should distribute correct amounts and emit FeesDistributed", async function () {
      const { distributor, usdc, owner, recipient1, recipient2 } = await loadFixture(fundedFixture);
      const amt1 = ethers.utils.parseUnits("300", 6);
      const amt2 = ethers.utils.parseUnits("200", 6);

      await expect(
        distributor.connect(owner).distributeERC20(
          usdc.address,
          [recipient1.address, recipient2.address],
          [amt1, amt2]
        )
      ).to.emit(distributor, "FeesDistributed");

      expect(await usdc.balanceOf(recipient1.address)).to.equal(amt1);
      expect(await usdc.balanceOf(recipient2.address)).to.equal(amt2);
    });
  });

  describe("withdrawERC20", function () {
    it("should allow owner to withdraw tokens", async function () {
      const { distributor, usdc, owner, fundAmount } = await loadFixture(fundedFixture);

      await distributor.connect(owner).withdrawERC20(usdc.address, owner.address, fundAmount);
      expect(await usdc.balanceOf(owner.address)).to.equal(fundAmount);
    });

    it("should revert if caller is not owner", async function () {
      const { distributor, usdc, other } = await loadFixture(fundedFixture);
      await expect(
        distributor.connect(other).withdrawERC20(usdc.address, other.address, 100)
      ).to.be.reverted;
    });
  });
});

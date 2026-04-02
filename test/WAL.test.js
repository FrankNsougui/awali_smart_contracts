const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("WAL", function () {
  async function deployFixture() {
    const [owner, other] = await ethers.getSigners();

    const WAL = await ethers.getContractFactory("WAL");
    const wal = await WAL.deploy("Awali Token", "WAL");
    await wal.deployed();

    return { wal, owner, other };
  }

  describe("mint", function () {
    it("should allow owner to mint tokens", async function () {
      const { wal, owner, other } = await loadFixture(deployFixture);
      const amount = ethers.utils.parseEther("1000");

      await wal.connect(owner).mint(other.address, amount);
      expect(await wal.balanceOf(other.address)).to.equal(amount);
    });

    it("should revert if caller is not owner", async function () {
      const { wal, other } = await loadFixture(deployFixture);
      const amount = ethers.utils.parseEther("1000");

      await expect(
        wal.connect(other).mint(other.address, amount)
      ).to.be.reverted;
    });
  });

  describe("burn", function () {
    it("should allow owner to burn tokens", async function () {
      const { wal, owner, other } = await loadFixture(deployFixture);
      const amount = ethers.utils.parseEther("500");

      await wal.connect(owner).mint(other.address, amount);
      await wal.connect(owner).burn(other.address, amount);

      expect(await wal.balanceOf(other.address)).to.equal(0);
    });

    it("should revert if caller is not owner", async function () {
      const { wal, owner, other } = await loadFixture(deployFixture);
      const amount = ethers.utils.parseEther("500");

      await wal.connect(owner).mint(other.address, amount);

      await expect(
        wal.connect(other).burn(other.address, amount)
      ).to.be.reverted;
    });
  });

  describe("token metadata", function () {
    it("should have correct name and symbol", async function () {
      const { wal } = await loadFixture(deployFixture);
      expect(await wal.name()).to.equal("Awali Token");
      expect(await wal.symbol()).to.equal("WAL");
    });
  });
});

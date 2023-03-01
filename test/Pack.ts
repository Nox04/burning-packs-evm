import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("Burn and receive gear", function () {
  async function deployOneYearLockFixture() {
    const [owner, otherAccount, secondAccount] = await ethers.getSigners();

    const gearContract = await ethers.getContractFactory("Gear");
    const packContract = await ethers.getContractFactory("Pack");
    const gear = await gearContract.deploy();
    const pack = await packContract.deploy(gear.address);
    await gear.transferOwnership(pack.address);

    return { gear, pack, owner, otherAccount, secondAccount };
  }

  describe("Burning packs and getting gear", function () {
    it("Owner should be able to mint packs", async function () {
      const { pack, otherAccount, owner } = await loadFixture(
        deployOneYearLockFixture
      );

      await pack.mintPack(otherAccount.address, "https://uri.here");

      expect(await pack.balanceOf(otherAccount.address)).to.equal(1);
      expect(await pack.balanceOf(owner.address)).to.equal(0);
    });

    it("Should set the right owner", async function () {
      const { pack, owner } = await loadFixture(deployOneYearLockFixture);

      expect(await pack.owner()).to.equal(owner.address);
    });

    it("Should fail if other account tries to mint", async function () {
      const { pack, otherAccount } = await loadFixture(
        deployOneYearLockFixture
      );

      await expect(
        pack
          .connect(otherAccount)
          .mintPack(otherAccount.address, "https://uri.here")
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should allow user to burn their token and receive a gear token", async function () {
      const { pack, gear, otherAccount } = await loadFixture(
        deployOneYearLockFixture
      );

      await pack.mintPack(otherAccount.address, "https://uri.here");

      expect(await pack.balanceOf(otherAccount.address)).to.equal(1);

      await expect(pack.connect(otherAccount).burnPack(1))
        .to.emit(pack, "Transfer")
        .withArgs(otherAccount.address, ethers.constants.AddressZero, 1);

      expect(await pack.balanceOf(otherAccount.address)).to.equal(0);
      expect(await gear.balanceOf(otherAccount.address)).to.equal(1);
    });

    it("Should fail if somebody wants to burn token from other user", async function () {
      const { pack, otherAccount, secondAccount } = await loadFixture(
        deployOneYearLockFixture
      );

      await pack.mintPack(otherAccount.address, "https://uri.here");

      expect(await pack.balanceOf(otherAccount.address)).to.equal(1);

      await expect(pack.connect(secondAccount).burnPack(1)).to.be.revertedWith(
        "ERC721Burnable: caller is not owner nor approved"
      );
    });

    it("Should allow owner to burn token from other user", async function () {
      const { pack, gear, otherAccount, owner } = await loadFixture(
        deployOneYearLockFixture
      );

      await pack.mintPack(otherAccount.address, "https://uri.here");

      expect(await pack.balanceOf(otherAccount.address)).to.equal(1);

      await expect(pack.connect(owner).burnPack(1))
        .to.emit(pack, "Transfer")
        .withArgs(otherAccount.address, ethers.constants.AddressZero, 1);

      expect(await pack.balanceOf(otherAccount.address)).to.equal(0);
      expect(await gear.balanceOf(otherAccount.address)).to.equal(1);
    });

    it("Should fail if somebody try to burn an unminted token", async function () {
      const { pack, otherAccount, owner } = await loadFixture(
        deployOneYearLockFixture
      );

      await pack.mintPack(otherAccount.address, "https://uri.here");

      expect(await pack.balanceOf(otherAccount.address)).to.equal(1);

      await expect(pack.connect(owner).burnPack(2)).to.be.revertedWith(
        "ERC721: mint to the zero address"
      );
    });
  });
});

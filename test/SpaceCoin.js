const { expect } = require("chai");
const { ethers } = require("hardhat");

const convertToToken = amount => amount / 10**18

describe("SpaceCoin contract", function () {
  let owner, contact2, contact3, Spacecoin, token = null;

  beforeEach(async () => {
    [owner, contact2, contact3] = await ethers.getSigners();

    SpaceCoin = await ethers.getContractFactory("SpaceCoin");
    
    token = await SpaceCoin.deploy(contact3.address);
    await token.deployed();
  });

  describe('Deployment', () => {
    it('Should set the right owner', async () => {
      expect(await token.owner()).to.equal(owner.address);
    });

    it('Should begin without an initial supply until minted', async () => {
      expect(await token.totalSupply()).to.equal(0);
    });

    it('Should have the correct name', async () => {
      expect(await token.name()).to.equal("SpaceCoin")
    });

    it('Should have the correct symbol', async () => {
      expect(await token.symbol()).to.equal("SPACE")
    });

    it('Should have the correct treasury address', async () => {
      expect(await token.treasury()).to.equal(contact3.address)
    });
  });

  describe('Transactions — Transfers', () => {
    it('Should be set to not tax by default', async () => {
      expect(await token.tax()).to.equal(false);
    });

    it('Should allow owners to toggle tax', async () => {
      await token.setTax(true);
      expect(await token.tax()).to.equal(true);
      await token.setTax(false);
      expect(await token.tax()).to.equal(false);
    });

    it('Should not allow addresses apart from owner to tax', async () => {
      await expect(token.connect(contact2).setTax(true)).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it('Should transfer 100% if tax is not enabled', async () => {
      expect(await token.tax()).to.equal(false);

      await token.mint(owner.address, 100);

      await token.transfer(contact2.address, 10);

      const ownerBalance = convertToToken(await token.balanceOf(owner.address));
      const contact2balance = convertToToken(await token.balanceOf(contact2.address));
      const treasuryBalance = convertToToken(await token.balanceOf(contact3.address));

      expect(ownerBalance).to.equal(90);
      expect(contact2balance).to.equal(10);
      expect(treasuryBalance).to.equal(0);
    });

    it('Should put 2% into the treasury if tax is enabled', async () => {
      await token.setTax(true);
      expect(await token.tax()).to.equal(true);

      await token.mint(owner.address, 100);

      await token.transfer(contact2.address, 10);

      const ownerBalance = convertToToken(await token.balanceOf(owner.address));
      const contact2balance = convertToToken(await token.balanceOf(contact2.address));
      const treasuryBalance = convertToToken(await token.balanceOf(contact3.address));

      expect(ownerBalance).to.equal(90);
      expect(contact2balance).to.equal(9.8);
      expect(treasuryBalance).to.equal(0.2);
    });

    it('Should not transfer if the sender does not have the necessary funds', async () => {
      const contact2balance = convertToToken(await token.balanceOf(contact2.address));
      expect(contact2balance).to.equal(0);

      await expect(token.transfer(contact2.address, 100)).to.be.revertedWith("Do not have the necessary funds to transfer");
    });
  });

  describe('Transactions — Mint', () => {
    it('Should only allow the owner to mint', async () => {
      await expect(token.connect(contact2).mint(contact2.address, 40)).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it('Should allow the owner to mint new tokens', async () => {
      await token.mint(owner.address, 40);

      const supply = convertToToken(await token.totalSupply())
      expect(supply).to.equal(40);
    });

    it('Should not allow minting more than the maximum supply', async () => {
      await expect(token.mint(owner.address, 600000)).to.be.revertedWith("Total supply has been reached");
    })
  });
});

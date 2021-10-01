const { expect } = require("chai");
const { ethers } = require("hardhat");

const toEther = amount => ethers.utils.parseEther(`${amount}`);

describe("ICO contract", function () {
  let owner, contact2, contact3, ICO = null;

  beforeEach(async () => {
    [owner, contact2, contact3, contact4] = await ethers.getSigners();

    ICO = await ethers.getContractFactory("ICO");

    contract = await ICO.deploy([contact2.address, contact3.address], contact4.address);
    await contract.deployed();
  });

  describe('Deployment', () => {
    it('Should set the right owner', async () => {
      expect(await contract.owner()).to.equal(owner.address);
    });
  });

  describe('Phases', () => {
    it('Only owners can change phases', async() => {
      await expect(contract.connect(contact2).nextPhase()).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it('Should change phases  one phase at a time', async() => {
      expect(await contract.phase()).to.equal(0);

      await contract.nextPhase();
      expect(await contract.phase()).to.equal(1);

      await contract.nextPhase();
      expect(await contract.phase()).to.equal(2);
    });

    it('Should only have 3 phases', async() => {
      await contract.nextPhase();
      await contract.nextPhase();
      expect(await contract.phase()).to.equal(2);
      
      await contract.nextPhase();
      expect(await contract.phase()).to.equal(2);
    });
  });

  describe('Contribution limits', async () => {
    it('Should have a contribution limit of 15,000 and an individual limit of 1,500 [Phase Seed]', async () => {
      expect(await contract.phase()).to.equal(0);

      expect(await contract.totalContributionLimit()).to.equal(toEther(15000));
      expect(await contract.indContributionLimit()).to.equal(toEther(1500));
    });

    it('Should have a contribution limit of 30,000 and an individual limit of 1,000 [Phase General]', async () => {
      await contract.nextPhase();
      expect(await contract.phase()).to.equal(1);

      expect(await contract.totalContributionLimit()).to.equal(toEther(30000));
      expect(await contract.indContributionLimit()).to.equal(toEther(1000));
    });

    it('Should have a contribution limit of 30,000 and no individual limit [Phase Open]', async () => {
      await contract.nextPhase();
      await contract.nextPhase();
      expect(await contract.phase()).to.equal(2);

      expect(await contract.totalContributionLimit()).to.equal(toEther(30000));
    });

    it('Should not be able to surpass individual contribution limit [Phase Seed]', async() => {
      expect(await contract.raisedCapital()).to.equal(0);
      
      await expect(contract.reserveTokens({ value: toEther(1501) })).to.be.revertedWith('Exceeded individual contribution limit')
    });
  });

  describe('Buying tokens', async() => {
    it('Should only allow private investors to participate in Seed Phase', async () => {
      await expect(contract.connect(contact2).reserveTokens({ value: toEther(300) })).to.not.be.reverted;
      await expect(contract.connect(contact4).reserveTokens({ value: toEther(300) })).to.be.revertedWith("Cannot participate in the Seed phase");
    });

    it('Should set raisedCapital after buying tokens', async () => {
      await contract.connect(contact2).reserveTokens({ value: toEther(300) });
      expect(await contract.raisedCapital()).to.equal(toEther(300));
    });

    it('Should set tokens for an address when they are bought', async () => {
      await contract.connect(contact2).reserveTokens({ value: toEther(400) });
      expect(await contract.connect(contact2).getPurchasedTokens()).to.equal(toEther(2000));
    });

    it('Should not release tokens until Phase Open', async() => {
      await expect(contract.getTokens()).to.be.revertedWith("Tokens are only available in Phase Open");
      await contract.nextPhase();
      await expect(contract.getTokens()).to.be.revertedWith("Tokens are only available in Phase Open");
    });

    it('Should be able to get tokens in Phase Open', async () => {
      await contract.nextPhase();
      await contract.nextPhase();

      await contract.connect(contact2).reserveTokens({ value: toEther(400) });
      await expect(contract.connect(contact2).getTokens()).to.not.be.reverted;
    });
  });

  describe('Pausing', async() => {
    it('Owner should be able to pause the purchasing of tokens', async() => {
      await contract.pause();

      await expect(contract.reserveTokens({ value: toEther(400) })).to.be.revertedWith('Pausable: paused');
    });

    it('Only owner should be able to pause the purchasing of tokens', async() => {
      await expect(contract.connect(contact2).pause()).to.be.revertedWith('Ownable: caller is not the owner');
    });

    it('Owner should be able to unpause the purchasing of tokens', async() => {
      await contract.pause();
      expect(await contract.paused()).to.equal(true);

      await contract.unpause();
      expect(await contract.paused()).to.equal(false);
    });
  });
});

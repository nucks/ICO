//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "./SpaceCoin.sol";

contract ICO is Pausable, Ownable {
  enum Phase {
    Seed,
    General,
    Open
  }

  Phase public phase;
  address[] private investors;
  mapping(address => uint) private payments;
  uint public raisedCapital;
  uint80 public totalContributionLimit = 15000 ether;
  uint80 public indContributionLimit = 1500 ether;
  SpaceCoin private spaceCoin;

  constructor(address[] memory _investors, address payable coin) {
    investors = _investors;
    spaceCoin = new SpaceCoin({ _treasury: coin });
  }

  function reserveTokens() external payable whenNotPaused {
    require(raisedCapital + msg.value <= totalContributionLimit, "Contribution limit has been reached");
    // TODO: ensure that they don't send more than they should when in other phases

    if (phase != Phase.Open) {
      require(msg.value <= indContributionLimit, "Exceeded individual contribution limit");
    }

    if (phase == Phase.Seed) {
      bool included = false;
      for (uint i = 0; i < investors.length; i++) {
        if (msg.sender == investors[i]) {
          included = true;
        }
      }
      require(included, "Cannot participate in the Seed phase");
    }

    raisedCapital += msg.value;
    payments[msg.sender] += msg.value;
  }

  function getTokens() external {
    require(phase == Phase.Open, "Tokens are only available in Phase Open");

    uint amount = payments[msg.sender];
    payments[msg.sender] = 0;

    spaceCoin.mint(msg.sender, amount * 5 / 10**18);
  }

  function nextPhase() external onlyOwner {
    if (phase == Phase.Seed) {
      phase = Phase.General;
      totalContributionLimit = 30000 ether;
      indContributionLimit = 1000 ether;
    } else if (phase == Phase.General) {
      phase = Phase.Open;
      // TODO: Remove individual contribution limit
    }
  }

  function pause() external onlyOwner {
      _pause();
  }

  function unpause() external onlyOwner {
      _unpause();
  }

  function getPurchasedTokens() external view returns (uint) {
    return payments[msg.sender] * 5;
  }
}

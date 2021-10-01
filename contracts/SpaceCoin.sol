//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SpaceCoin is ERC20, Ownable {
    address payable public treasury;
    uint constant private MAX_TOTAL_SUPPLY = 500000 * 10**18;
    bool public tax;

    constructor(address payable _treasury) ERC20("SpaceCoin", "SPACE") {
        tax = false;
        treasury = _treasury;
    }

    function mint(address account, uint256 amount) external onlyOwner {
        uint mintAmount = _tokenize(amount);
        require(totalSupply() + mintAmount <= MAX_TOTAL_SUPPLY, "Total supply has been reached");

        _mint(account, mintAmount);
    }

    function transfer(address recipient, uint256 amount) public override returns (bool) {
        uint tokenAmount = _tokenize(amount);
        require(balanceOf(msg.sender) >= tokenAmount, "Do not have the necessary funds to transfer");

        if (tax) {
            _transfer(msg.sender, treasury, tokenAmount * 2 / 100);
            tokenAmount = tokenAmount * 98 / 100;
        }

        _transfer(msg.sender, recipient, tokenAmount);
        return true;
    }

    function setTax(bool _tax) external onlyOwner {
        tax = _tax;
    }

    function _tokenize(uint amount) internal view returns (uint) {
        return amount * 10**decimals();
    }
}

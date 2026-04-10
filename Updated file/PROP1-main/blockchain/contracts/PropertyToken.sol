// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PropertyToken is ERC20, Ownable {

    constructor(
        string memory name_,
        string memory symbol_,
        uint256 initialSupply,
        address initialHolder   // FractionalInvestment contract
    )
        ERC20(name_, symbol_)
        Ownable(msg.sender)
    {
        // ✅ Mint all fractional shares to FractionalInvestment contract
        _mint(initialHolder, initialSupply);
    }
}

// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract CDAAuthority is Ownable {

    mapping(uint256 => bool) private approvedProperties;

    constructor(address initialOwner) Ownable(initialOwner) {}

    function approveProperty(uint256 propertyId) external onlyOwner {
        approvedProperties[propertyId] = true;
    }

    function revokeApproval(uint256 propertyId) external onlyOwner {
        approvedProperties[propertyId] = false;
    }

    function isApproved(uint256 propertyId) external view returns (bool) {
        return approvedProperties[propertyId];
    }
}

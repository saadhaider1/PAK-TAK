// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "./PropertyToken.sol";
import "./RealEstateRegistry.sol";
import "./CDAAuthority.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract FractionalInvestment is ReentrancyGuard {

    struct FractionalListing {
        address tokenAddress;
        uint256 propertyId;
        address payable propertyOwner;
        uint256 totalShares;
        uint256 remainingShares;
        uint256 pricePerShare;
        bool active;
    }

    mapping(uint256 => FractionalListing) public listings;
    uint256 public listingCount;

    RealEstateRegistry public registry;
    CDAAuthority public cdaAuthority;

    event FractionalCreated(
        uint256 indexed listingId,
        uint256 indexed propertyId,
        address tokenAddress,
        uint256 totalShares,
        uint256 pricePerShare
    );

    event SharesPurchased(
        uint256 indexed listingId,
        address buyer,
        uint256 shares,
        uint256 amountPaid
    );

    event OwnerWithdraw(uint256 indexed listingId, uint256 amount);

    constructor(address _registry, address _cdaAuthority) {
        registry = RealEstateRegistry(_registry);
        cdaAuthority = CDAAuthority(_cdaAuthority);
    }

    function createFractional(
        uint256 propertyId,
        string memory name,
        string memory symbol,
        uint256 totalShares,
        uint256 pricePerShare
    ) external returns (uint256) {

        RealEstateRegistry.Property memory p = registry.getProperty(propertyId);

        require(p.owner == msg.sender, "Not property owner");
        require(
            p.status == RealEstateRegistry.Status.LISTED ||
            p.status == RealEstateRegistry.Status.UNLISTED,
            "Not eligible"
        );

        // ✅ CDA COMPLIANCE CHECK
        require(
            cdaAuthority.isApproved(propertyId),
            "Property not CDA approved"
        );

        // ✅ Deploy ERC20 token and mint shares to THIS contract
        PropertyToken token = new PropertyToken(
            name,
            symbol,
            totalShares,
            address(this)
        );

        listings[listingCount] = FractionalListing({
            tokenAddress: address(token),
            propertyId: propertyId,
            propertyOwner: payable(msg.sender),
            totalShares: totalShares,
            remainingShares: totalShares,
            pricePerShare: pricePerShare,
            active: true
        });

        registry.markFractionalized(propertyId);

        emit FractionalCreated(
            listingCount,
            propertyId,
            address(token),
            totalShares,
            pricePerShare
        );

        listingCount++;
        return listingCount - 1;
    }

    function buyShares(uint256 listingId, uint256 shares)
        external
        payable
        nonReentrant
    {
        FractionalListing storage l = listings[listingId];

        require(l.active, "Listing inactive");
        require(shares > 0 && shares <= l.remainingShares, "Invalid shares");

        uint256 cost = shares * l.pricePerShare;
        require(msg.value == cost, "Incorrect ETH sent");

        PropertyToken token = PropertyToken(l.tokenAddress);

        // ✅ ERC20 transfer now works correctly
        token.transfer(msg.sender, shares);

        l.remainingShares -= shares;

        emit SharesPurchased(listingId, msg.sender, shares, cost);
    }

    function withdrawFunds(uint256 listingId) external nonReentrant {
        FractionalListing storage l = listings[listingId];
        require(msg.sender == l.propertyOwner, "Not owner");

        uint256 amount = address(this).balance;
        require(amount > 0, "No funds");

        (bool sent,) = l.propertyOwner.call{value: amount}("");
        require(sent, "Withdraw failed");

        emit OwnerWithdraw(listingId, amount);
    }

    receive() external payable {}
}

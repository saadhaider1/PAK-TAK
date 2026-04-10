// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./CDAAuthority.sol";

contract RealEstateRegistry is ReentrancyGuard {

    enum Status { NONE, PENDING, LISTED, SOLD, FRACTIONALIZED, UNLISTED }

    struct Property {
        uint256 id;
        address payable owner;
        uint256 price;
        string title;
        string category;
        string images;
        string propertyAddress;
        string description;
        Status status;
    }

    mapping(uint256 => Property) private properties;
    uint256 public propertyCount;

    address public fractionalContract;
    address public crowdfundingContract;
    address public cdaAuthority;

    // ---------------- EVENTS ----------------
    event PropertySubmitted(uint256 indexed id, address indexed owner);
    event PropertyApproved(uint256 indexed id);
    event PropertyListed(uint256 indexed id, uint256 price);
    event PropertySold(uint256 indexed id, address oldOwner, address newOwner);

    // ---------------- MODIFIERS ----------------
    modifier onlyOwnerOf(uint256 id) {
        require(properties[id].owner == msg.sender, "Not owner");
        _;
    }

    // ---------------- SETTERS ----------------
    function setCDAAuthority(address _cda) external {
        cdaAuthority = _cda;
    }

    function setFractionalContract(address _addr) external {
        fractionalContract = _addr;
    }

    function setCrowdfundingContract(address _addr) external {
        crowdfundingContract = _addr;
    }

    // ---------------- PROPERTY FLOW ----------------

    /// Step 1: Submit property (PENDING)
    function listProperty(
        uint256 price,
        string memory title,
        string memory category,
        string memory images,
        string memory _propertyAddress,
        string memory description
    ) external returns (uint256) {

        require(price > 0, "Price > 0");

        uint256 id = propertyCount;
        require(cdaAuthority != address(0), "CDA not set");

require(
    CDAAuthority(cdaAuthority).isApproved(id),
    "Property not CDA approved"
);


        properties[id] = Property({
            id: id,
            owner: payable(msg.sender),
            price: price,
            title: title,
            category: category,
            images: images,
            propertyAddress: _propertyAddress,
            description: description,
            status: Status.PENDING
        });

        propertyCount++;
        emit PropertySubmitted(id, msg.sender);
        return id;
    }

    /// Step 2: CDA approves property
    function approveProperty(uint256 id) external {
        require(cdaAuthority != address(0), "CDA not set");

        require(
            CDAAuthority(cdaAuthority).isApproved(id),
            "Not CDA approved"
        );

        Property storage p = properties[id];
        require(p.status == Status.PENDING, "Invalid state");

        p.status = Status.LISTED;
        emit PropertyApproved(id);
        emit PropertyListed(id, p.price);
    }
    function markFractionalized(uint256 id) external returns (bool) {
    require(msg.sender == fractionalContract, "Only fractional contract");

    Property storage p = properties[id];
    require(p.status == Status.LISTED, "Property not listed");

    p.status = Status.FRACTIONALIZED;
    return true;
}


    /// Buy property
    function buyProperty(uint256 id) external payable nonReentrant {
        Property storage p = properties[id];

        require(p.status == Status.LISTED, "Not for sale");
        require(msg.value >= p.price, "Insufficient funds");
        require(msg.sender != p.owner, "Owner cannot buy");

        address payable oldOwner = p.owner;
        (bool sent,) = oldOwner.call{value: msg.value}("");
        require(sent, "Payment failed");

        p.owner = payable(msg.sender);
        p.status = Status.SOLD;

        emit PropertySold(id, oldOwner, msg.sender);
    }

    // ---------------- GETTERS ----------------
    function getProperty(uint256 id) external view returns (Property memory) {
        return properties[id];
    }
}

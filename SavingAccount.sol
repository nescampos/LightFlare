// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SavingsContract {
    address public owner;
    mapping(address => uint256) public savings;
    mapping(address => bool) public isSavingsActive;

    event SavingsTransferred(address indexed user, uint256 amount);
    event SavingsActivated(address indexed user, bool isActive);
    event TransactionExecuted(address indexed user, uint256 roundedUpAmount, uint256 change);
    event NFTGenerated(address indexed user, uint256 savings, uint256 timestamp);
    event SavingsWithdrawn(address indexed user, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not the contract owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function toggleSavingsActivation() internal {
        isSavingsActive[msg.sender] = !isSavingsActive[msg.sender];
    }

    function activateSavings() external {
        toggleSavingsActivation();
        emit SavingsActivated(msg.sender, true);
    }

    function deactivateSavings() external {
        toggleSavingsActivation();
        emit SavingsActivated(msg.sender, false);
    }

    function transferSavings() public payable {
        require(msg.sender != address(0), "Invalid user address");
        require(msg.value > 0, "Invalid amount");
        require(isSavingsActive[msg.sender], "Savings not activated for the user");

        savings[msg.sender] += msg.value;
        emit SavingsTransferred(msg.sender, msg.value);
    }

    function withdrawSavings() public payable {
        uint256 accumulatedSavings = savings[msg.sender];

        require(accumulatedSavings > 0, "No savings to collect");

        // Transfer accumulated savings to the owner
        payable(msg.sender).transfer(accumulatedSavings);

        savings[msg.sender] -= accumulatedSavings;

        emit SavingsWithdrawn(owner, accumulatedSavings);
    }

    function roundUp(uint256 amount) internal view returns (uint256) {
        // Round up the amount to the nearest multiple of 10
        uint256 remainder = amount % 10**18;
        if (remainder == 0) {
            return amount;
        } else {
            return amount + (10**18 - remainder);
        }
    }

    function isUserActive() external view returns (bool) {
        return isSavingsActive[msg.sender];
    }

    function getSavingsBalance() external view returns (uint256) {
        return savings[msg.sender];
    }
}
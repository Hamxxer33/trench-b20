// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/// @notice Pull-payment fee escrow. Router credits creator / platform / referrer.
///         Anyone can pay out a recorded balance to its owner.
contract TrenchEscrow {
    address public immutable factory;
    mapping(address => bool) public creditors;
    mapping(address account => mapping(address asset => uint256)) public owed; // asset 0 = ETH

    error NotFactory();
    error NotCreditor();
    error TransferFailed();
    error ZeroAmount();

    event Credited(address indexed account, address indexed asset, uint256 amount);
    event Claimed(address indexed account, address indexed asset, address indexed to, uint256 amount);
    event CreditorSet(address indexed account, bool allowed);

    modifier onlyFactory() {
        if (msg.sender != factory) revert NotFactory();
        _;
    }

    constructor() {
        factory = msg.sender;
        creditors[msg.sender] = true;
    }

    function setCreditor(address account, bool allowed) external onlyFactory {
        creditors[account] = allowed;
        emit CreditorSet(account, allowed);
    }

    function credit(address account, address asset, uint256 amount) external {
        if (!creditors[msg.sender]) revert NotCreditor();
        if (amount == 0 || account == address(0)) return;
        owed[account][asset] += amount;
        emit Credited(account, asset, amount);
    }

    function claim(address asset) external {
        _pay(msg.sender, asset, msg.sender);
    }

    function claimTo(address asset, address to) external {
        if (to == address(0)) revert TransferFailed();
        _pay(msg.sender, asset, to);
    }

    /// @notice Anyone may trigger a payout; funds always go to the recorded owner.
    function claimFor(address account, address asset) external {
        _pay(account, asset, account);
    }

    function _pay(address account, address asset, address to) internal {
        uint256 amount = owed[account][asset];
        if (amount == 0) revert ZeroAmount();
        owed[account][asset] = 0;
        if (asset == address(0)) {
            (bool ok,) = to.call{value: amount}("");
            if (!ok) revert TransferFailed();
        } else {
            (bool ok, bytes memory data) = asset.call(abi.encodeWithSelector(0xa9059cbb, to, amount));
            if (!ok || (data.length != 0 && !abi.decode(data, (bool)))) revert TransferFailed();
        }
        emit Claimed(account, asset, to, amount);
    }

    receive() external payable {}
}

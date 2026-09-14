// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/// @notice Per-wallet public identity and first-write-wins global referrer.
///         Separate from each token's onchain profile.
contract TrenchProfiles {
    struct Profile {
        string name;
        string bio;
        string avatar;
        string website;
        string twitter;
        string telegram;
        address globalReferrer;
        bool set;
    }

    address public immutable factory;
    mapping(address => Profile) public profiles;
    mapping(address => address[]) public launchedBy;

    error NameTooLong();
    error BioTooLong();
    error ReferrerLocked();
    error BadReferrer();
    error NotFactory();

    constructor() {
        factory = msg.sender;
    }

    event ProfileUpdated(address indexed account);
    event GlobalReferrerSet(address indexed account, address indexed referrer);
    event LaunchRecorded(address indexed creator, address indexed token);

    function setProfile(
        string calldata name,
        string calldata bio,
        string calldata avatar,
        string calldata website,
        string calldata twitter,
        string calldata telegram
    ) external {
        if (bytes(name).length > 48) revert NameTooLong();
        if (bytes(bio).length > 280) revert BioTooLong();
        Profile storage p = profiles[msg.sender];
        p.name = name;
        p.bio = bio;
        p.avatar = avatar;
        p.website = website;
        p.twitter = twitter;
        p.telegram = telegram;
        p.set = true;
        emit ProfileUpdated(msg.sender);
    }

    /// @notice First referrer sticks. Cannot be the caller.
    function setGlobalReferrer(address referrer) external {
        if (referrer == address(0) || referrer == msg.sender) revert BadReferrer();
        Profile storage p = profiles[msg.sender];
        if (p.globalReferrer != address(0)) revert ReferrerLocked();
        p.globalReferrer = referrer;
        p.set = true;
        emit GlobalReferrerSet(msg.sender, referrer);
    }

    function recordLaunch(address creator, address token) external {
        if (msg.sender != factory) revert NotFactory();
        launchedBy[creator].push(token);
        emit LaunchRecorded(creator, token);
    }

    function launchCount(address creator) external view returns (uint256) {
        return launchedBy[creator].length;
    }

    function launches(address creator, uint256 offset, uint256 limit) external view returns (address[] memory out) {
        address[] storage list = launchedBy[creator];
        uint256 n = list.length;
        if (offset >= n) return new address[](0);
        uint256 end = offset + limit;
        if (end > n) end = n;
        out = new address[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            out[i - offset] = list[n - 1 - i];
        }
    }
}

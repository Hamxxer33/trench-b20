// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

interface IB20 {
    function name() external view returns (string memory);
    function symbol() external view returns (string memory);
    function decimals() external view returns (uint8);
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function mint(address to, uint256 amount) external;
    function updateSupplyCap(uint256 newSupplyCap) external;
    function supplyCap() external view returns (uint256);
    function hasRole(bytes32 role, address account) external view returns (bool);
}

interface IB20Factory {
    enum B20Variant {
        ASSET,
        STABLECOIN
    }

    struct B20AssetCreateParams {
        uint8 version;
        string name;
        string symbol;
        address initialAdmin;
        uint8 decimals;
    }

    event B20Created(
        address indexed token,
        B20Variant indexed variant,
        string name,
        string symbol,
        uint8 decimals,
        bytes variantEventParams
    );

    function createB20(B20Variant variant, bytes32 salt, bytes calldata params, bytes[] calldata initCalls)
        external
        payable
        returns (address token);

    function getB20Address(B20Variant variant, address sender, bytes32 salt) external view returns (address);
    function isB20(address token) external view returns (bool);
    function isB20Initialized(address token) external view returns (bool);
}

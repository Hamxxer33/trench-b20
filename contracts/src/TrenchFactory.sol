// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {IB20, IB20Factory} from "./interfaces/IB20.sol";
import {IPoolManager} from "./interfaces/IV4.sol";
import {TrenchLocker} from "./TrenchLocker.sol";
import {TrenchEscrow} from "./TrenchEscrow.sol";
import {TrenchProfiles} from "./TrenchProfiles.sol";

/// @notice Trench launchpad factory.
///         One tx: admin-less B20 + locked Uniswap v4 ETH pool.
///         Swap fees (via TrenchRouter): 50% creator / 30% platform / 20% referrer.
contract TrenchFactory {
    uint256 public constant TOTAL_SUPPLY = 1_000_000_000 ether;
    IB20Factory public constant B20_FACTORY = IB20Factory(0xB20f000000000000000000000000000000000000);
    uint8 public constant ASSET_DECIMALS = 18;
    uint8 public constant PARAMS_VERSION = 1;

    uint16 public constant CREATOR_FEE_BPS = 5_000;
    uint16 public constant PLATFORM_FEE_BPS = 3_000;
    uint16 public constant REFERRAL_FEE_BPS = 2_000;
    uint16 public constant SWAP_FEE_BPS = 100; // 1% of quote
    uint16 public constant ANTI_SNIPE_START_BPS = 9_900;
    uint32 public constant ANTI_SNIPE_WINDOW = 20;

    TrenchLocker public immutable locker;
    TrenchEscrow public immutable escrow;
    TrenchProfiles public immutable userProfiles;

    address public owner;
    address public platform;
    address public router;

    int24 public openingTick = 199_200;
    uint16 public tokenSuffix = 0xB20;
    uint256 public lastSaltUint;

    struct TokenProfile {
        address originalCreator;
        address currentCreator;
        address creatorFeeRecipient;
        uint64 createdAt;
        int24 tickLower;
        int24 tickUpper;
        bool editable;
        address quote;
        string image;
        string description;
        string website;
        string twitter;
        string telegram;
    }

    struct LaunchParams {
        string name;
        string symbol;
        bytes32 salt;
        string image;
        string description;
        string website;
        string twitter;
        string telegram;
        bool editable;
        address quote;
    }

    address[] public allTokens;
    mapping(address => TokenProfile) public tokenProfiles;
    mapping(address => bool) public isTrench;
    mapping(address => bool) public allowedQuote;

    error NotOwner();
    error NotCreator();
    error NotEditable();
    error BadSuffix(address token);
    error EmptyField();
    error NameTooLong();
    error AlreadyLaunched();
    error ZeroAddress();
    error BadQuote();

    event Launched(
        address indexed token,
        address indexed creator,
        string name,
        string symbol,
        bytes32 salt,
        bool editable,
        uint256 index
    );
    event TokenProfileUpdated(address indexed token);
    event CreatorFeeRecipientSet(address indexed token, address indexed recipient);
    event PlatformSet(address indexed platform);
    event RouterSet(address indexed router);

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    constructor(IPoolManager poolManager, address platform_) {
        if (platform_ == address(0)) revert ZeroAddress();
        owner = msg.sender;
        platform = platform_;
        locker = new TrenchLocker(poolManager);
        escrow = new TrenchEscrow();
        userProfiles = new TrenchProfiles();
        allowedQuote[address(0)] = true;
        // Base stock B20s (8 decimals), Coinbase catalog used by o1.
        allowedQuote[0xb200000000000000000000C2e324d24d7eEcd1fb] = true; // AAPL
        allowedQuote[0xb200000000000000000000d9192b6B456483C2E8] = true; // AMZN
        allowedQuote[0xb2000000000000000000002D0BA3164cc74f58B7] = true; // GOOGL
        allowedQuote[0xb2000000000000000000008bC8786B856E61707C] = true; // META
        allowedQuote[0xB200000000000000000000Ab99cFa739E253872B] = true; // MSFT
        allowedQuote[0xb2000000000000000000004884b426556b92883d] = true; // MSTR
        allowedQuote[0xb20000000000000000000078ee7ce2fE4908108C] = true; // NVDA
        allowedQuote[0xb200000000000000000000397293Cb8cda9a10c5] = true; // SNDK
        allowedQuote[0xb2000000000000000000007b9fcbd005511aCBd5] = true; // SPCX
        allowedQuote[0xb2000000000000000000001e800a7f5189430cD0] = true; // TSLA
    }

    function setAllowedQuote(address quote, bool allowed) external onlyOwner {
        allowedQuote[quote] = allowed;
    }

    function setOwner(address next) external onlyOwner {
        if (next == address(0)) revert ZeroAddress();
        owner = next;
    }

    function setPlatform(address platform_) external onlyOwner {
        if (platform_ == address(0)) revert ZeroAddress();
        platform = platform_;
        emit PlatformSet(platform_);
    }

    function setRouter(address router_) external onlyOwner {
        if (router_ == address(0)) revert ZeroAddress();
        if (router != address(0)) revert AlreadyLaunched();
        router = router_;
        escrow.setCreditor(router_, true);
        emit RouterSet(router_);
    }

    function setOpeningTick(int24 tick) external onlyOwner {
        require(tick % 200 == 0, "align");
        openingTick = tick;
    }

    function setTokenSuffix(uint16 suffix) external onlyOwner {
        require(suffix <= 0xFFF, "suffix");
        tokenSuffix = suffix;
    }

    function launchCount() external view returns (uint256) {
        return allTokens.length;
    }

    function predictToken(bytes32 salt) public view returns (address) {
        return B20_FACTORY.getB20Address(IB20Factory.B20Variant.ASSET, address(this), salt);
    }

    function launch(LaunchParams calldata p) external returns (address token) {
        if (bytes(p.name).length == 0 || bytes(p.symbol).length == 0) revert EmptyField();
        if (bytes(p.name).length > 50 || bytes(p.symbol).length > 12) revert NameTooLong();
        if (!allowedQuote[p.quote]) revert BadQuote();

        token = predictToken(p.salt);
        if (isTrench[token]) revert AlreadyLaunched();
        if (uint160(token) & 0xFFF != tokenSuffix) revert BadSuffix(token);

        bytes memory params = abi.encode(
            IB20Factory.B20AssetCreateParams({
                version: PARAMS_VERSION,
                name: p.name,
                symbol: p.symbol,
                initialAdmin: address(0),
                decimals: ASSET_DECIMALS
            })
        );

        bytes[] memory initCalls = new bytes[](2);
        initCalls[0] = abi.encodeWithSelector(IB20.updateSupplyCap.selector, TOTAL_SUPPLY);
        initCalls[1] = abi.encodeWithSelector(IB20.mint.selector, address(locker), TOTAL_SUPPLY);

        address created = B20_FACTORY.createB20(IB20Factory.B20Variant.ASSET, p.salt, params, initCalls);
        require(created == token, "addr");

        locker.seed(token, msg.sender, openingTick, p.quote);

        uint256 saltUint = uint256(p.salt);
        if (saltUint > lastSaltUint) lastSaltUint = saltUint;

        isTrench[token] = true;
        allTokens.push(token);

        (,, int24 tickLower, int24 tickUpper,,,) = locker.positions(token);
        tokenProfiles[token] = TokenProfile({
            originalCreator: msg.sender,
            currentCreator: msg.sender,
            creatorFeeRecipient: msg.sender,
            createdAt: uint64(block.timestamp),
            tickLower: tickLower,
            tickUpper: tickUpper,
            editable: p.editable,
            quote: p.quote,
            image: p.image,
            description: p.description,
            website: p.website,
            twitter: p.twitter,
            telegram: p.telegram
        });

        userProfiles.recordLaunch(msg.sender, token);

        emit Launched(token, msg.sender, p.name, p.symbol, p.salt, p.editable, allTokens.length - 1);
    }

    function updateTokenProfile(
        address token,
        string calldata image,
        string calldata description,
        string calldata website,
        string calldata twitter,
        string calldata telegram
    ) external {
        TokenProfile storage tp = tokenProfiles[token];
        if (msg.sender != tp.currentCreator) revert NotCreator();
        if (!tp.editable) revert NotEditable();
        tp.image = image;
        tp.description = description;
        tp.website = website;
        tp.twitter = twitter;
        tp.telegram = telegram;
        emit TokenProfileUpdated(token);
    }

    function setCreatorFeeRecipient(address token, address recipient) external {
        TokenProfile storage tp = tokenProfiles[token];
        if (msg.sender != tp.currentCreator) revert NotCreator();
        if (recipient == address(0)) revert ZeroAddress();
        tp.creatorFeeRecipient = recipient;
        emit CreatorFeeRecipientSet(token, recipient);
    }

    function tokens(uint256 offset, uint256 limit) external view returns (address[] memory out) {
        uint256 n = allTokens.length;
        if (offset >= n) return new address[](0);
        uint256 end = offset + limit;
        if (end > n) end = n;
        out = new address[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            out[i - offset] = allTokens[n - 1 - i];
        }
    }

    function feeBpsAt(address token) public view returns (uint16) {
        TokenProfile storage tp = tokenProfiles[token];
        if (tp.createdAt == 0) return SWAP_FEE_BPS;
        uint256 elapsed = block.timestamp - tp.createdAt;
        if (elapsed >= ANTI_SNIPE_WINDOW) return SWAP_FEE_BPS;
        uint256 drop = uint256(ANTI_SNIPE_START_BPS - SWAP_FEE_BPS) * elapsed / ANTI_SNIPE_WINDOW;
        return uint16(ANTI_SNIPE_START_BPS - drop);
    }
}

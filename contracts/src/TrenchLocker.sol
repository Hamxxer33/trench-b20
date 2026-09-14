// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {IB20} from "./interfaces/IB20.sol";
import {
    BalanceDelta,
    BalanceDeltaLibrary,
    Currency,
    IHooks,
    IPoolManager,
    IUnlockCallback,
    ModifyLiquidityParams,
    PoolKey
} from "./interfaces/IV4.sol";
import {LiquidityAmounts} from "./libraries/LiquidityAmounts.sol";
import {TickMath} from "./libraries/TickMath.sol";

/// @notice Owns every Trench Uniswap v4 position. Liquidity can never be withdrawn.
///         Quote is ETH (address(0)) or a registered stock B20.
contract TrenchLocker is IUnlockCallback {
    using BalanceDeltaLibrary for BalanceDelta;

    uint24 public constant POOL_FEE = 0;
    int24 public constant TICK_SPACING = 200;

    IPoolManager public immutable poolManager;
    address public immutable factory;

    struct Position {
        address creator;
        address quote;
        int24 tickLower;
        int24 tickUpper;
        uint128 liquidity;
        bool seeded;
        bool launchIsToken1;
    }

    mapping(address token => Position) public positions;

    error NotFactory();
    error NotPoolManager();
    error AlreadySeeded();
    error NoLiquidity();
    error TransferFailed();

    event Seeded(address indexed token, address indexed creator, address quote, int24 tickLower, int24 tickUpper, uint128 liquidity);

    constructor(IPoolManager poolManager_) {
        poolManager = poolManager_;
        factory = msg.sender;
    }

    function poolKey(address token) public view returns (PoolKey memory key) {
        address quote = positions[token].quote;
        address c0 = quote;
        address c1 = token;
        if (uint160(c0) > uint160(c1)) (c0, c1) = (c1, c0);
        key = PoolKey({
            currency0: Currency.wrap(c0),
            currency1: Currency.wrap(c1),
            fee: POOL_FEE,
            tickSpacing: TICK_SPACING,
            hooks: IHooks(address(0))
        });
    }

    function seed(address token, address creator, int24 openingTick, address quote) external {
        if (msg.sender != factory) revert NotFactory();
        Position storage pos = positions[token];
        if (pos.seeded) revert AlreadySeeded();
        require(openingTick % TICK_SPACING == 0, "align");

        bool launchIsToken1 = uint160(token) > uint160(quote);
        int24 tickLower;
        int24 tickUpper;
        if (launchIsToken1) {
            tickLower = TickMath.minUsableTick(TICK_SPACING);
            tickUpper = openingTick;
        } else {
            tickLower = -openingTick;
            tickUpper = TickMath.maxUsableTick(TICK_SPACING);
        }
        require(tickUpper > tickLower, "ticks");

        pos.creator = creator;
        pos.quote = quote;
        pos.tickLower = tickLower;
        pos.tickUpper = tickUpper;
        pos.launchIsToken1 = launchIsToken1;

        poolManager.unlock(abi.encode(token));
        pos.seeded = true;
        emit Seeded(token, creator, quote, tickLower, tickUpper, pos.liquidity);
    }

    function unlockCallback(bytes calldata data) external returns (bytes memory) {
        if (msg.sender != address(poolManager)) revert NotPoolManager();
        address token = abi.decode(data, (address));
        Position storage pos = positions[token];
        PoolKey memory key = poolKey(token);

        int24 initTick = pos.launchIsToken1 ? pos.tickUpper : pos.tickLower;
        uint160 sqrtPriceX96 = TickMath.getSqrtPriceAtTick(initTick);
        poolManager.initialize(key, sqrtPriceX96);

        uint256 amount = IB20(token).balanceOf(address(this));
        if (amount == 0) revert NoLiquidity();

        uint160 sqrtLower = TickMath.getSqrtPriceAtTick(pos.tickLower);
        uint160 sqrtUpper = TickMath.getSqrtPriceAtTick(pos.tickUpper);
        uint128 liquidity = pos.launchIsToken1
            ? LiquidityAmounts.getLiquidityForAmount1(sqrtLower, sqrtUpper, amount)
            : LiquidityAmounts.getLiquidityForAmount0(sqrtLower, sqrtUpper, amount);
        pos.liquidity = liquidity;

        (BalanceDelta delta,) = poolManager.modifyLiquidity(
            key,
            ModifyLiquidityParams({
                tickLower: pos.tickLower,
                tickUpper: pos.tickUpper,
                liquidityDelta: int256(uint256(liquidity)),
                salt: bytes32(0)
            }),
            ""
        );

        _settleOwed(token, delta.amount0(), delta.amount1(), pos.launchIsToken1);
        return "";
    }

    function _settleOwed(address token, int128 d0, int128 d1, bool launchIsToken1) internal {
        if (launchIsToken1) {
            if (d1 < 0) {
                poolManager.sync(Currency.wrap(token));
                bool ok = IB20(token).transfer(address(poolManager), uint256(uint128(-d1)));
                if (!ok) revert TransferFailed();
                poolManager.settle();
            }
            if (d0 < 0) revert NoLiquidity();
        } else {
            if (d0 < 0) {
                poolManager.sync(Currency.wrap(token));
                bool ok = IB20(token).transfer(address(poolManager), uint256(uint128(-d0)));
                if (!ok) revert TransferFailed();
                poolManager.settle();
            }
            if (d1 < 0) revert NoLiquidity();
        }
    }
}

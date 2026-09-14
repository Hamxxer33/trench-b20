// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {IB20} from "./interfaces/IB20.sol";
import {
    BalanceDelta,
    BalanceDeltaLibrary,
    Currency,
    IPoolManager,
    IUnlockCallback,
    PoolKey,
    SwapParams
} from "./interfaces/IV4.sol";
import {TickMath} from "./libraries/TickMath.sol";
import {TrenchFactory} from "./TrenchFactory.sol";
import {TrenchLocker} from "./TrenchLocker.sol";
import {TrenchEscrow} from "./TrenchEscrow.sol";

/// @notice Exact-in swaps against ETH or a stock quote. 1% of quote + anti-snipe.
contract TrenchRouter is IUnlockCallback {
    using BalanceDeltaLibrary for BalanceDelta;

    IPoolManager public immutable poolManager;
    TrenchFactory public immutable factory;
    TrenchEscrow public immutable escrow;

    error NotPoolManager();
    error UnknownToken();
    error Slippage();
    error ZeroAmount();
    error TransferFailed();
    error BadValue();

    struct Intent {
        address token;
        address quote;
        address recipient;
        address payer;
        address referrer;
        bool zeroForOne;
        bool isBuy;
        uint256 amountIn;
        uint256 minOut;
        uint16 feeBps;
        bytes32 comment;
    }

    Intent private _intent;

    event Trade(
        address indexed token,
        address indexed trader,
        address indexed referrer,
        bool isBuy,
        uint256 amountIn,
        uint256 amountOut,
        uint256 fee,
        bytes32 comment
    );

    constructor(IPoolManager poolManager_, TrenchFactory factory_) {
        poolManager = poolManager_;
        factory = factory_;
        escrow = factory_.escrow();
    }

    function buy(address token, uint256 amountIn, uint256 minOut, address recipient, address referrer, bytes32 comment)
        external
        payable
        returns (uint256 amountOut)
    {
        if (!factory.isTrench(token)) revert UnknownToken();
        if (recipient == address(0)) recipient = msg.sender;
        address quote = _quoteOf(token);
        bool eth = quote == address(0);
        if (eth) {
            if (msg.value == 0) revert ZeroAmount();
            amountIn = msg.value;
        } else {
            if (msg.value != 0) revert BadValue();
            if (amountIn == 0) revert ZeroAmount();
            bool ok = IB20(quote).transferFrom(msg.sender, address(this), amountIn);
            if (!ok) revert TransferFailed();
        }

        uint16 feeBps = factory.feeBpsAt(token);
        uint256 fee = (amountIn * feeBps) / 10_000;
        uint256 swapIn = amountIn - fee;
        if (swapIn == 0) revert ZeroAmount();

        _splitFee(token, quote, msg.sender, referrer, fee, feeBps);

        bool launchIsToken1 = uint160(token) > uint160(quote);
        _intent = Intent({
            token: token,
            quote: quote,
            recipient: recipient,
            payer: msg.sender,
            referrer: referrer,
            zeroForOne: launchIsToken1,
            isBuy: true,
            amountIn: swapIn,
            minOut: minOut,
            feeBps: feeBps,
            comment: comment
        });
        bytes memory result = poolManager.unlock("");
        amountOut = abi.decode(result, (uint256));
        if (eth && address(this).balance > 0) {
            (bool refunded,) = msg.sender.call{value: address(this).balance}("");
            if (!refunded) revert TransferFailed();
        }
        emit Trade(token, msg.sender, _resolvedReferrer(token, msg.sender, referrer), true, amountIn, amountOut, fee, comment);
        delete _intent;
    }

    function sell(address token, uint256 amountIn, uint256 minOut, address recipient, address referrer, bytes32 comment)
        external
        returns (uint256 amountOut)
    {
        if (amountIn == 0) revert ZeroAmount();
        if (!factory.isTrench(token)) revert UnknownToken();
        if (recipient == address(0)) recipient = msg.sender;
        bool ok = IB20(token).transferFrom(msg.sender, address(this), amountIn);
        if (!ok) revert TransferFailed();

        address quote = _quoteOf(token);
        bool launchIsToken1 = uint160(token) > uint160(quote);
        _intent = Intent({
            token: token,
            quote: quote,
            recipient: recipient,
            payer: msg.sender,
            referrer: referrer,
            zeroForOne: !launchIsToken1,
            isBuy: false,
            amountIn: amountIn,
            minOut: minOut,
            feeBps: factory.feeBpsAt(token),
            comment: comment
        });
        bytes memory result = poolManager.unlock("");
        amountOut = abi.decode(result, (uint256));

        uint256 fee = (amountOut * _intent.feeBps) / 10_000;
        uint256 net = amountOut - fee;
        _splitFee(token, quote, msg.sender, referrer, fee, _intent.feeBps);
        _pay(quote, recipient, net);
        emit Trade(token, msg.sender, _resolvedReferrer(token, msg.sender, referrer), false, amountIn, net, fee, comment);
        delete _intent;
    }

    function unlockCallback(bytes calldata) external returns (bytes memory) {
        if (msg.sender != address(poolManager)) revert NotPoolManager();
        Intent memory it = _intent;
        PoolKey memory key = TrenchLocker(payable(address(factory.locker()))).poolKey(it.token);
        uint160 limit = it.zeroForOne ? TickMath.MIN_SQRT_PRICE + 1 : TickMath.MAX_SQRT_PRICE - 1;
        BalanceDelta delta = poolManager.swap(
            key,
            SwapParams({zeroForOne: it.zeroForOne, amountSpecified: -int256(it.amountIn), sqrtPriceLimitX96: limit}),
            ""
        );

        uint256 amountOut;
        if (it.isBuy) {
            _settleInput(it.quote, it.zeroForOne ? delta.amount0() : delta.amount1());
            int128 outDelta = it.zeroForOne ? delta.amount1() : delta.amount0();
            if (outDelta <= 0) revert Slippage();
            amountOut = uint256(uint128(outDelta));
            if (amountOut < it.minOut) revert Slippage();
            poolManager.take(Currency.wrap(it.token), it.recipient, amountOut);
        } else {
            _settleInput(it.token, it.zeroForOne ? delta.amount0() : delta.amount1());
            int128 outDelta = it.zeroForOne ? delta.amount1() : delta.amount0();
            if (outDelta <= 0) revert Slippage();
            amountOut = uint256(uint128(outDelta));
            if (amountOut < it.minOut) revert Slippage();
            poolManager.take(Currency.wrap(it.quote), address(this), amountOut);
            uint256 leftover = IB20(it.token).balanceOf(address(this));
            if (leftover > 0) {
                bool sentTok = IB20(it.token).transfer(it.payer, leftover);
                if (!sentTok) revert TransferFailed();
            }
        }
        return abi.encode(amountOut);
    }

    function _settleInput(address asset, int128 dIn) internal {
        if (dIn >= 0) return;
        uint256 owe = uint256(uint128(-dIn));
        if (asset == address(0)) {
            poolManager.settle{value: owe}();
        } else {
            poolManager.sync(Currency.wrap(asset));
            bool ok = IB20(asset).transfer(address(poolManager), owe);
            if (!ok) revert TransferFailed();
            poolManager.settle();
        }
    }

    function _splitFee(address token, address quote, address trader, address referrer, uint256 fee, uint16 totalFeeBps)
        internal
    {
        if (fee == 0) return;
        uint16 baseBps = factory.SWAP_FEE_BPS();
        uint256 baseFee = totalFeeBps <= baseBps ? fee : (fee * baseBps) / totalFeeBps;

        address creator = _creatorRecipient(token);
        address plat = factory.platform();
        address ref = _resolvedReferrer(token, trader, referrer);

        uint256 toCreator = (baseFee * factory.CREATOR_FEE_BPS()) / 10_000;
        uint256 toRef = ref == address(0) ? 0 : (baseFee * factory.REFERRAL_FEE_BPS()) / 10_000;
        uint256 toPlat = fee - toCreator - toRef;

        escrow.credit(creator, quote, toCreator);
        escrow.credit(plat, quote, toPlat);
        if (toRef > 0) escrow.credit(ref, quote, toRef);
        _pay(quote, address(escrow), fee);
    }

    function _pay(address asset, address to, uint256 amount) internal {
        if (amount == 0) return;
        if (asset == address(0)) {
            (bool ok,) = to.call{value: amount}("");
            if (!ok) revert TransferFailed();
        } else {
            bool ok = IB20(asset).transfer(to, amount);
            if (!ok) revert TransferFailed();
        }
    }

    function _quoteOf(address token) internal view returns (address) {
        (,,,,,,, address quote,,,,,) = factory.tokenProfiles(token);
        return quote;
    }

    function _creatorRecipient(address token) internal view returns (address) {
        (,, address recipient,,,,,,,,,,) = factory.tokenProfiles(token);
        return recipient;
    }

    function _resolvedReferrer(address token, address trader, address referrer) internal view returns (address) {
        address candidate = referrer;
        if (candidate == address(0)) {
            (,,,,,, address globalRef,) = factory.userProfiles().profiles(trader);
            candidate = globalRef;
        }
        if (!_validReferrer(token, trader, candidate)) return address(0);
        return candidate;
    }

    function _validReferrer(address token, address trader, address ref) internal view returns (bool) {
        if (ref == address(0) || ref == trader) return false;
        if (ref == address(this) || ref == address(factory) || ref == address(escrow)) return false;
        if (ref == address(factory.locker()) || ref == address(poolManager)) return false;
        if (ref == factory.platform()) return false;
        (address original, address current, address recipient,,,,,,,,,,) = factory.tokenProfiles(token);
        if (ref == original || ref == current || ref == recipient) return false;
        return true;
    }

    receive() external payable {}
}

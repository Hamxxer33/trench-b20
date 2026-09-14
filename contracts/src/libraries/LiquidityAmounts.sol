// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {FullMath} from "./FullMath.sol";

library LiquidityAmounts {
    uint256 internal constant Q96 = 0x1000000000000000000000000;

    function getLiquidityForAmount1(uint160 sqrtPriceAX96, uint160 sqrtPriceBX96, uint256 amount1)
        internal
        pure
        returns (uint128 liquidity)
    {
        if (sqrtPriceAX96 > sqrtPriceBX96) (sqrtPriceAX96, sqrtPriceBX96) = (sqrtPriceBX96, sqrtPriceAX96);
        uint256 liq = FullMath.mulDiv(amount1, Q96, sqrtPriceBX96 - sqrtPriceAX96);
        require(liq <= type(uint128).max, "liq");
        liquidity = uint128(liq);
    }

    function getLiquidityForAmount0(uint160 sqrtPriceAX96, uint160 sqrtPriceBX96, uint256 amount0)
        internal
        pure
        returns (uint128 liquidity)
    {
        if (sqrtPriceAX96 > sqrtPriceBX96) (sqrtPriceAX96, sqrtPriceBX96) = (sqrtPriceBX96, sqrtPriceAX96);
        uint256 intermediate = FullMath.mulDiv(sqrtPriceAX96, sqrtPriceBX96, Q96);
        uint256 liq = FullMath.mulDiv(amount0, intermediate, sqrtPriceBX96 - sqrtPriceAX96);
        require(liq <= type(uint128).max, "liq");
        liquidity = uint128(liq);
    }
}

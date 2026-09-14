// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script, console} from "forge-std/Script.sol";
import {IPoolManager} from "../src/interfaces/IV4.sol";
import {TrenchFactory} from "../src/TrenchFactory.sol";
import {TrenchRouter} from "../src/TrenchRouter.sol";

contract Deploy is Script {
    address constant BASE_V4_POOL_MANAGER = 0x498581fF718922c3f8e6A244956aF099B2652b2b;

    function run() external {
        address platform = vm.envAddress("PLATFORM");
        vm.startBroadcast();
        TrenchFactory factory = new TrenchFactory(IPoolManager(BASE_V4_POOL_MANAGER), platform);
        TrenchRouter router = new TrenchRouter(IPoolManager(BASE_V4_POOL_MANAGER), factory);
        factory.setRouter(address(router));
        vm.stopBroadcast();
        console.log("TrenchFactory", address(factory));
        console.log("TrenchLocker", address(factory.locker()));
        console.log("TrenchEscrow", address(factory.escrow()));
        console.log("TrenchProfiles", address(factory.userProfiles()));
        console.log("TrenchRouter", address(router));
        console.log("Platform", platform);
    }
}

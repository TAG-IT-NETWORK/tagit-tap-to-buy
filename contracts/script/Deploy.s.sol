// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Script, console2} from "@forge-std/Script.sol";
import {OfferEscrow} from "../src/OfferEscrow.sol";

/// @notice Deploys OfferEscrow to Base Sepolia.
/// Usage:
///   forge script script/Deploy.s.sol --rpc-url base_sepolia --broadcast --verify
contract Deploy is Script {
    function run() external returns (OfferEscrow escrow) {
        uint256 timeout = vm.envOr("OFFER_TIMEOUT_SECONDS", uint256(24 hours));
        uint256 pk = vm.envUint("DEPLOYER_PRIVATE_KEY");

        vm.startBroadcast(pk);
        escrow = new OfferEscrow(timeout);
        vm.stopBroadcast();

        console2.log("OfferEscrow deployed at:", address(escrow));
        console2.log("Timeout (s):", timeout);
    }
}

// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.0;

import { Script } from "forge-std/Script.sol";

import { Auditor, IPriceFeed } from "@exactly/protocol/Auditor.sol";
import { InterestRateModel, Parameters } from "@exactly/protocol/InterestRateModel.sol";
import { Market } from "@exactly/protocol/Market.sol";
import { MockBalancerVault } from "@exactly/protocol/mocks/MockBalancerVault.sol";
import { MockPriceFeed } from "@exactly/protocol/mocks/MockPriceFeed.sol";
import { Previewer } from "@exactly/protocol/periphery/Previewer.sol";

import { ERC1967Proxy } from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

import { MockWETH } from "@exactly/protocol/mocks/MockWETH.sol";

import { MockERC20 } from "solmate/src/test/utils/mocks/MockERC20.sol";

contract DeployProtocol is Script {
  Auditor public auditor;
  Market public exaEXA;
  Market public exaUSDC;
  Market public exaWETH;
  MockERC20 public exa;
  MockERC20 public usdc;
  MockWETH public weth;
  Previewer public previewer;

  MockBalancerVault public balancer;

  function run() external {
    vm.startBroadcast();

    auditor = Auditor(address(new ERC1967Proxy(address(new Auditor(18)), "")));
    auditor.initialize(Auditor.LiquidationIncentive(0.09e18, 0.01e18));
    vm.label(address(auditor), "Auditor");

    Parameters memory irmParams = Parameters({
      minRate: 3.5e16,
      naturalRate: 8e16,
      maxUtilization: 1.3e18,
      naturalUtilization: 0.75e18,
      growthSpeed: 1.1e18,
      sigmoidSpeed: 2.5e18,
      spreadFactor: 0.2e18,
      maturitySpeed: 0.5e18,
      timePreference: 0.01e18,
      fixedAllocation: 0.6e18,
      maxRate: 15_000e16
    });
    InterestRateModel irm = InterestRateModel(address(0));

    exa = new MockERC20("exactly", "EXA", 18);
    vm.label(address(exa), "EXA");
    exaEXA = Market(address(new ERC1967Proxy(address(new Market(exa, auditor)), "")));
    exaEXA.initialize("EXA", 3, 1e18, irm, 0.02e18 / uint256(1 days), 1e17, 0, 0.0046e18, 0.4e18);
    exaEXA.setInterestRateModel(new InterestRateModel(irmParams, exaEXA));
    vm.label(address(exaEXA), "exaEXA");
    auditor.enableMarket(exaEXA, new MockPriceFeed(18, 5e18), 0.8e18);

    usdc = new MockERC20("USD Coin", "USDC", 6);
    vm.label(address(usdc), "USDC");
    exaUSDC = Market(address(new ERC1967Proxy(address(new Market(usdc, auditor)), "")));
    exaUSDC.initialize("USDC", 3, 1e6, irm, 0.02e18 / uint256(1 days), 1e17, 0, 0.0046e18, 0.4e18);
    exaUSDC.setInterestRateModel(new InterestRateModel(irmParams, exaUSDC));
    vm.label(address(exaUSDC), "exaUSDC");
    auditor.enableMarket(exaUSDC, new MockPriceFeed(18, 1e18), 0.9e18);

    weth = new MockWETH();
    vm.label(address(weth), "WETH");
    exaWETH = Market(address(new ERC1967Proxy(address(new Market(weth, auditor)), "")));
    exaWETH.initialize("WETH", 3, 1e6, irm, 0.02e18 / uint256(1 days), 1e17, 0, 0.0046e18, 0.4e18);
    exaWETH.setInterestRateModel(new InterestRateModel(irmParams, exaWETH));
    vm.label(address(exaWETH), "exaWETH");
    auditor.enableMarket(exaWETH, new MockPriceFeed(18, 2500e18), 0.86e18);

    previewer = new Previewer(auditor, IPriceFeed(address(0)));

    balancer = new MockBalancerVault();
    exa.mint(address(balancer), 1_000_000e18);
    usdc.mint(address(balancer), 1_000_000e6);
    vm.label(address(balancer), "BalancerVault");

    vm.stopBroadcast();
  }
}

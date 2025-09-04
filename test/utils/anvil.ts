import { $ } from "execa";
import { anvil } from "prool/instances";
import { brand, check, type InferOutput, literal, object, parse, pipe, string, transform, tuple } from "valibot";
import { type Address as ViemAddress, checksumAddress, isAddress, zeroAddress } from "viem";
import { foundry } from "viem/chains";
import type { TestProject } from "vitest/node";

import anvilClient from "./anvilClient.js";

export default async function setup({ provide }: TestProject) {
  const instance = anvil({ codeSizeLimit: 42_000, blockBaseFeePerGas: 1n, timestamp: 0 });
  const initialize = await instance
    .start()
    .then(() => true)
    .catch(() => false);

  const deployer = parse(
    Address,
    await anvilClient
      .getAddresses()
      .then(([address]) => address ?? zeroAddress)
      .catch(() => zeroAddress),
  );
  provide("deployer", deployer);

  if (initialize) {
    await $`forge script test/utils/Protocol.s.sol --code-size-limit 42000
      --sender ${deployer} --unlocked ${deployer} --rpc-url ${foundry.rpcUrls.default.http[0]} --broadcast --slow`;
  }

  // eslint-disable-next-line unicorn/no-unreadable-array-destructuring
  const [, , , , , , , , , , , usdc, , marketUSDC, , , , , , , , marketWETH, , , , , , previewer, ratePreviewer] =
    parse(Protocol, await import(`broadcast/Protocol.s.sol/${String(foundry.id)}/run-latest.json`)).transactions;

  provide("MarketUSDC", marketUSDC.contractAddress);
  provide("MarketWETH", marketWETH.contractAddress);
  provide("Previewer", previewer.contractAddress);
  provide("RatePreviewer", ratePreviewer.contractAddress);
  provide("USDC", usdc.contractAddress);

  if (initialize) await anvilClient.setAutomine(false);

  return async function teardown() {
    await instance.stop();
  };
}

const Address = pipe(
  string(),
  check((input) => isAddress(input, { strict: false }), "bad address"),
  transform((input) => checksumAddress(input as ViemAddress)),
  brand("Address"),
);
export type Address = InferOutput<typeof Address>; // eslint-disable-line @typescript-eslint/no-redeclare

const Protocol = object({
  transactions: tuple([
    object({ transactionType: literal("CREATE"), contractName: literal("Auditor") }),
    object({ transactionType: literal("CREATE"), contractName: literal("ERC1967Proxy"), contractAddress: Address }),
    object({ transactionType: literal("CALL") }),
    object({ transactionType: literal("CREATE"), contractName: literal("MockERC20"), contractAddress: Address }),
    object({ transactionType: literal("CREATE"), contractName: literal("Market") }),
    object({ transactionType: literal("CREATE"), contractName: literal("ERC1967Proxy"), contractAddress: Address }),
    object({ transactionType: literal("CALL") }),
    object({ transactionType: literal("CREATE"), contractName: literal("InterestRateModel") }),
    object({ transactionType: literal("CALL") }),
    object({ transactionType: literal("CREATE"), contractName: literal("MockPriceFeed") }),
    object({ transactionType: literal("CALL") }),
    object({ transactionType: literal("CREATE"), contractName: literal("MockERC20"), contractAddress: Address }),
    object({ transactionType: literal("CREATE"), contractName: literal("Market") }),
    object({ transactionType: literal("CREATE"), contractName: literal("ERC1967Proxy"), contractAddress: Address }),
    object({ transactionType: literal("CALL") }),
    object({ transactionType: literal("CREATE"), contractName: literal("InterestRateModel") }),
    object({ transactionType: literal("CALL") }),
    object({ transactionType: literal("CREATE"), contractName: literal("MockPriceFeed") }),
    object({ transactionType: literal("CALL") }),
    object({ transactionType: literal("CREATE"), contractName: literal("MockWETH"), contractAddress: Address }),
    object({ transactionType: literal("CREATE"), contractName: literal("Market") }),
    object({ transactionType: literal("CREATE"), contractName: literal("ERC1967Proxy"), contractAddress: Address }),
    object({ transactionType: literal("CALL") }),
    object({ transactionType: literal("CREATE"), contractName: literal("InterestRateModel") }),
    object({ transactionType: literal("CALL") }),
    object({ transactionType: literal("CREATE"), contractName: literal("MockPriceFeed") }),
    object({ transactionType: literal("CALL") }),
    object({ transactionType: literal("CREATE"), contractName: literal("Previewer"), contractAddress: Address }),
    object({ transactionType: literal("CREATE"), contractName: literal("RatePreviewer"), contractAddress: Address }),
    object({
      transactionType: literal("CREATE"),
      contractName: literal("MockBalancerVault"),
      contractAddress: Address,
    }),
  ]),
});

declare module "vitest" {
  export interface ProvidedContext {
    deployer: Address;
    MarketUSDC: Address;
    MarketWETH: Address;
    Previewer: Address;
    RatePreviewer: Address;
    USDC: Address;
  }
}

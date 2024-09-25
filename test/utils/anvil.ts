import { $ } from "execa";
import { anvil } from "prool/instances";
import { brand, check, type InferOutput, literal, null_, object, parse, pipe, string, transform, tuple } from "valibot";
import { type Address as ViemAddress, checksumAddress, isAddress, padHex, zeroAddress } from "viem";
import { privateKeyToAddress } from "viem/accounts";
import { foundry } from "viem/chains";
import type { GlobalSetupContext } from "vitest/node";

import anvilClient from "./anvilClient.js";

export default async function setup({ provide }: GlobalSetupContext) {
  const instance = anvil({ codeSizeLimit: 42_000, blockBaseFeePerGas: 1n });
  const initialize = await instance
    .start()
    .then(() => true)
    .catch(() => false);

  const keeperAddress = privateKeyToAddress(padHex("0x69"));
  if (initialize) await anvilClient.setBalance({ address: keeperAddress, value: 10n ** 24n });

  const deployer = await anvilClient
    .getAddresses()
    .then(([address]) => address ?? zeroAddress)
    .catch(() => zeroAddress);

  if (initialize) {
    await $`forge script test/utils/Protocol.s.sol --code-size-limit 42000
      --sender ${deployer} --unlocked ${deployer} --rpc-url ${foundry.rpcUrls.default.http[0]} --broadcast --slow`;
  }

  // eslint-disable-next-line unicorn/no-unreadable-array-destructuring
  const [, , , , , , , , , , , usdc, , marketUSDC, , , , , , , , marketWETH, , , , , , previewer] = parse(
    Protocol,
    await import(`broadcast/Protocol.s.sol/${String(foundry.id)}/run-latest.json`),
  ).transactions;

  provide("MarketUSDC", marketUSDC.contractAddress);
  provide("MarketWETH", marketWETH.contractAddress);
  provide("Previewer", previewer.contractAddress);
  provide("USDC", usdc.contractAddress);

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
    object({ transactionType: literal("CREATE"), contractName: null_(), contractAddress: Address }),
    object({ transactionType: literal("CREATE"), contractName: literal("Market") }),
    object({ transactionType: literal("CREATE"), contractName: literal("ERC1967Proxy"), contractAddress: Address }),
    object({ transactionType: literal("CALL") }),
    object({ transactionType: literal("CREATE"), contractName: literal("InterestRateModel") }),
    object({ transactionType: literal("CALL") }),
    object({ transactionType: literal("CREATE"), contractName: literal("MockPriceFeed") }),
    object({ transactionType: literal("CALL") }),
    object({ transactionType: literal("CREATE"), contractName: null_(), contractAddress: Address }),
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
    object({
      transactionType: literal("CREATE"),
      contractName: literal("MockBalancerVault"),
      contractAddress: Address,
    }),
  ]),
});

declare module "vitest" {
  export interface ProvidedContext {
    MarketUSDC: Address;
    MarketWETH: Address;
    Previewer: Address;
    USDC: Address;
  }
}

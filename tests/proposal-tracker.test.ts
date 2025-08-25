import {
  Clarinet,
  Tx,
  Chain,
  Account,
  types,
} from "https://deno.land/x/clarinet@v1.0.0/index.ts";
import { assertEquals } from "https://deno.land/std@0.90.0/testing/asserts.ts";

Clarinet.test({
  name: "Create SIP-031 grant proposal with full metadata",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let recipient = accounts.get("wallet_1")!;

    let block = chain.mineBlock([
      Tx.contractCall(
        "proposal-tracker",
        "create-proposal",
        [
          types.ascii("sBTC Integration Grant"),
          types.ascii(
            "Develop sBTC integration for DeFi protocols to enhance Bitcoin L2 ecosystem"
          ),
          types.uint(50000000000),
          types.principal(recipient.address),
          types.ascii("DeFi"),
          types.ascii("https://forum.stacks.org/t/sbtc-integration-proposal"),
          types.ascii("https://github.com/project/sbtc-integration"),
          types.ascii(
            "M1: Smart contract development; M2: Testing; M3: Deployment"
          ),
        ],
        deployer.address
      ),
    ]);
    assertEquals(block.receipts.length, 1);
    assertEquals(block.receipts[0].result, "(ok u0)");

    let result = chain.callReadOnlyFn(
      "proposal-tracker",
      "get-proposal",
      [types.uint(0)],
      deployer.address
    );

    let metadata = chain.callReadOnlyFn(
      "proposal-tracker",
      "get-proposal-metadata",
      [types.uint(0)],
      deployer.address
    );

    assertEquals(result.result.includes("sBTC Integration Grant"), true);
    assertEquals(metadata.result.includes("forum.stacks.org"), true);
  },
});

Clarinet.test({
  name: "Activate proposal and vote with STX weighting",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let voter = accounts.get("wallet_1")!;
    let recipient = accounts.get("wallet_2")!;

    let block = chain.mineBlock([
      Tx.contractCall(
        "proposal-tracker",
        "create-proposal",
        [
          types.ascii("DeFi Liquidity Program"),
          types.ascii(
            "Bootstrap liquidity for sBTC/STX trading pairs across DEXs"
          ),
          types.uint(100000000000),
          types.principal(recipient.address),
          types.ascii("DeFi"),
          types.ascii("https://forum.stacks.org/t/defi-liquidity-program"),
          types.ascii("https://github.com/project/defi-liquidity"),
          types.ascii(
            "M1: DEX integration; M2: Liquidity deployment; M3: Monitoring"
          ),
        ],
        deployer.address
      ),
      Tx.contractCall(
        "proposal-tracker",
        "activate-proposal",
        [types.uint(0)],
        deployer.address
      ),
      Tx.contractCall(
        "proposal-tracker",
        "vote",
        [types.uint(0), types.bool(true), types.uint(5000000000)],
        voter.address
      ),
    ]);

    assertEquals(block.receipts.length, 3);
    assertEquals(block.receipts[0].result, "(ok u0)");
    assertEquals(block.receipts[1].result, "(ok true)");
    assertEquals(block.receipts[2].result, "(ok true)");

    let voteResult = chain.callReadOnlyFn(
      "proposal-tracker",
      "get-vote-counts",
      [types.uint(0)],
      deployer.address
    );
    assertEquals(voteResult.result.includes("yes: u1"), true);
  },
});

Clarinet.test({
  name: "Test proposal lifecycle from creation to execution",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let voter1 = accounts.get("wallet_1")!;
    let voter2 = accounts.get("wallet_2")!;
    let recipient = accounts.get("wallet_3")!;

    let block1 = chain.mineBlock([
      Tx.contractCall(
        "proposal-tracker",
        "create-proposal",
        [
          types.ascii("Core Protocol Upgrade"),
          types.ascii(
            "Implement Nakamoto upgrade features for improved Bitcoin finality"
          ),
          types.uint(75000000000),
          types.principal(recipient.address),
          types.ascii("Core"),
          types.ascii("https://forum.stacks.org/t/nakamoto-upgrade"),
          types.ascii("https://github.com/stacks-network/stacks-core"),
          types.ascii(
            "M1: Code review; M2: Testnet deployment; M3: Mainnet activation"
          ),
        ],
        deployer.address
      ),
      Tx.contractCall(
        "proposal-tracker",
        "activate-proposal",
        [types.uint(0)],
        deployer.address
      ),
    ]);

    let block2 = chain.mineBlock([
      Tx.contractCall(
        "proposal-tracker",
        "vote",
        [types.uint(0), types.bool(true), types.uint(15000000000)],
        voter1.address
      ),
      Tx.contractCall(
        "proposal-tracker",
        "vote",
        [types.uint(0), types.bool(true), types.uint(8000000000)],
        voter2.address
      ),
    ]);

    assertEquals(block1.receipts[0].result, "(ok u0)");
    assertEquals(block1.receipts[1].result, "(ok true)");
    assertEquals(block2.receipts[0].result, "(ok true)");
    assertEquals(block2.receipts[1].result, "(ok true)");

    let voteCount = chain.callReadOnlyFn(
      "proposal-tracker",
      "get-vote-counts",
      [types.uint(0)],
      deployer.address
    );
    assertEquals(voteCount.result.includes("yes: u2"), true);
  },
});

Clarinet.test({
  name: "Prevent double voting and unauthorized access",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let voter = accounts.get("wallet_1")!;
    let recipient = accounts.get("wallet_2")!;

    let block = chain.mineBlock([
      Tx.contractCall(
        "proposal-tracker",
        "create-proposal",
        [
          types.ascii("Security Audit Grant"),
          types.ascii("Comprehensive security audit of sBTC smart contracts"),
          types.uint(25000000000),
          types.principal(recipient.address),
          types.ascii("Security"),
          types.ascii("https://forum.stacks.org/t/security-audit"),
          types.ascii("https://github.com/project/security-audit"),
          types.ascii(
            "M1: Contract review; M2: Vulnerability assessment; M3: Report"
          ),
        ],
        deployer.address
      ),
      Tx.contractCall(
        "proposal-tracker",
        "activate-proposal",
        [types.uint(0)],
        deployer.address
      ),
      Tx.contractCall(
        "proposal-tracker",
        "vote",
        [types.uint(0), types.bool(true), types.uint(3000000000)],
        voter.address
      ),
      Tx.contractCall(
        "proposal-tracker",
        "vote",
        [types.uint(0), types.bool(false), types.uint(2000000000)],
        voter.address
      ),
    ]);

    assertEquals(block.receipts.length, 4);
    assertEquals(block.receipts[0].result, "(ok u0)");
    assertEquals(block.receipts[1].result, "(ok true)");
    assertEquals(block.receipts[2].result, "(ok true)");
    assertEquals(block.receipts[3].result, "(err u102)");
  },
});

Clarinet.test({
  name: "Test voting parameters and governance controls",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let updateBlock = chain.mineBlock([
      Tx.contractCall(
        "proposal-tracker",
        "update-voting-parameters",
        [
          types.uint(2000000000),
          types.uint(2016),
          types.uint(288),
          types.uint(20000000000),
        ],
        deployer.address
      ),
    ]);
    assertEquals(updateBlock.receipts[0].result, "(ok true)");

    let params = chain.callReadOnlyFn(
      "proposal-tracker",
      "get-voting-parameters",
      [],
      deployer.address
    );
    assertEquals(params.result.includes("min-threshold: u2000000000"), true);
    assertEquals(params.result.includes("voting-period: u2016"), true);
  },
});

Clarinet.test({
  name: "Test proposal count and metadata retrieval",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let recipient = accounts.get("wallet_1")!;

    let initialCount = chain.callReadOnlyFn(
      "proposal-tracker",
      "get-proposal-count",
      [],
      deployer.address
    );

    let block = chain.mineBlock([
      Tx.contractCall(
        "proposal-tracker",
        "create-proposal",
        [
          types.ascii("Education Initiative"),
          types.ascii("Develop educational content for Bitcoin L2 developers"),
          types.uint(15000000000),
          types.principal(recipient.address),
          types.ascii("Education"),
          types.ascii("https://forum.stacks.org/t/education-initiative"),
          types.ascii("https://github.com/project/education"),
          types.ascii(
            "M1: Content creation; M2: Platform development; M3: Launch"
          ),
        ],
        deployer.address
      ),
    ]);

    let newCount = chain.callReadOnlyFn(
      "proposal-tracker",
      "get-proposal-count",
      [],
      deployer.address
    );

    assertEquals(block.receipts[0].result, "(ok u0)");
    assertEquals(newCount.result, "(+ " + initialCount.result + " u1)");
  },
});

export type BlockchainRoadmapStatus = "personal" | "alternative" | "optional";

export interface BlockchainRoadmapNode {
  id: string;
  title: string;
  status?: BlockchainRoadmapStatus;
  roadmapId?: string;
}

export interface BlockchainRoadmapGroup {
  id: string;
  parent?: BlockchainRoadmapNode;
  items: BlockchainRoadmapNode[];
}

export interface BlockchainRoadmapStage {
  id: string;
  node: BlockchainRoadmapNode;
  left?: BlockchainRoadmapGroup[];
  right?: BlockchainRoadmapGroup[];
  noteAfter?: string;
  projectIdea?: string;
}

export interface BlockchainRoadmapSection {
  id: string;
  title?: string;
  stages: BlockchainRoadmapStage[];
}

export interface BlockchainRoadmapLink {
  label: string;
  roadmapId: string;
}

export const BLOCKCHAIN_MARKERS: Array<{
  status: BlockchainRoadmapStatus;
  label: string;
}> = [
  { status: "personal", label: "Personal Recommendation" },
  { status: "alternative", label: "Alternative Option" },
  { status: "optional", label: "Order not strict on roadmap" },
];

export const BLOCKCHAIN_RELATED_ROADMAPS: BlockchainRoadmapLink[] = [
  { label: "Computer Science", roadmapId: "skill-computer-science" },
  { label: "Software Architect", roadmapId: "software-architect" },
  { label: "Linux", roadmapId: "skill-linux" },
  { label: "Frontend", roadmapId: "frontend" },
  { label: "Backend", roadmapId: "backend" },
  { label: "Node.js", roadmapId: "skill-nodejs" },
];

export const BLOCKCHAIN_CONTINUE_LEARNING: BlockchainRoadmapLink[] = [
  { label: "Backend", roadmapId: "backend" },
  { label: "JavaScript", roadmapId: "skill-javascript" },
  { label: "Python", roadmapId: "skill-python" },
  { label: "Rust", roadmapId: "skill-rust" },
  { label: "Software Architect", roadmapId: "software-architect" },
];

const slug = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const n = (
  title: string,
  status?: BlockchainRoadmapStatus,
  roadmapId?: string,
  customId?: string
): BlockchainRoadmapNode => ({
  id: customId ?? slug(title),
  title,
  status,
  roadmapId,
});

const g = (
  items: BlockchainRoadmapNode[],
  parent?: BlockchainRoadmapNode,
  customId?: string
): BlockchainRoadmapGroup => ({
  id: customId ?? slug(parent?.title ?? items[0]?.title ?? "group"),
  parent,
  items,
});

const stage = (
  title: string,
  options: Omit<BlockchainRoadmapStage, "id" | "node"> & {
    status?: BlockchainRoadmapStatus;
    customId?: string;
    roadmapId?: string;
  } = {}
): BlockchainRoadmapStage => {
  const { status, customId, roadmapId, ...rest } = options;

  return {
    id: customId ?? slug(title),
    node: n(title, status, roadmapId, customId),
    ...rest,
  };
};

const FOUNDATIONS: BlockchainRoadmapSection = {
  id: "foundations",
  title: "Blockchain Foundations",
  stages: [
    stage("Introduction", {
      left: [
        g([
          n("What is Blockchain", "personal"),
          n("Why it matters?", "personal"),
          n("Applications and Uses", "personal"),
        ]),
      ],
      right: [
        g([
          n("Blockchain Structure", "personal"),
          n("Cryptography & Hashing", "personal"),
          n("Decentralization", "personal"),
          n("Decentralization vs Trust", "personal"),
          n("Blockchain Networks", "personal"),
        ]),
      ],
    }),
    stage("Understanding Blockchain", {
      left: [
        g(
          [
            n("Ethereum", "personal"),
            n("Polygon", "personal"),
            n("BNB Chain", "optional"),
            n("Gnosis Chain", "optional"),
            n("Avalanche", "optional"),
            n("Fantom", "optional"),
            n("Moonbeam / Moonriver", "optional"),
          ],
          n("EVM-Based", "personal")
        ),
      ],
      right: [
        g(
          [n("PoW", "personal"), n("PoS", "personal"), n("PoH", "optional"), n("BFT", "optional")],
          n("Consensus Protocols", "personal")
        ),
        g([
          n("Basic Blockchain Operations", "personal"),
          n("Blockchain Interoperability", "personal"),
          n("Storage", "personal"),
          n("Blockchain Forking", "personal"),
          n("Cryptocurrencies", "personal"),
          n("Cryptowallets", "personal"),
          n("Mining & Incentive Models", "personal"),
          n("Environmental Considerations", "personal"),
        ]),
      ],
    }),
    stage("Types of Blockchains", {
      left: [
        g([n("Bitcoin", "personal"), n("Cardano", "personal")], n("UTXO-Based", "personal")),
        g(
          [
            n("Everscale", "alternative"),
            n("Gosh", "alternative"),
            n("Venom", "alternative"),
            n("TON", "alternative"),
          ],
          n("TVM-Based", "alternative")
        ),
        g(
          [
            n("Arbitrum", "optional"),
            n("Optimism", "optional"),
            n("Base", "optional"),
            n("Starknet", "optional"),
          ],
          n("L2 Blockchains", "optional")
        ),
        g([n("Solana", "alternative")]),
      ],
      noteAfter:
        "Understand the differences between EVM, UTXO, and TVM execution environments and consensus models before choosing your primary development stack.",
    }),
  ],
};

const SMART_CONTRACTS_SECTION: BlockchainRoadmapSection = {
  id: "smart-contracts-and-security",
  title: "Smart Contracts & Security",
  stages: [
    stage("Smart Contracts", {
      left: [
        g(
          [
            n("Unit Tests", "personal"),
            n("Integration Tests", "personal"),
            n("Code Coverage", "personal"),
          ],
          n("Testing", "personal", undefined, "sc-testing-parent")
        ),
        g([
          n("Deployment", "personal", undefined, "sc-deployment"),
          n("Monitoring", "personal"),
          n("Upgrades", "personal"),
          n("ERC Tokens", "personal"),
        ]),
      ],
      right: [
        g(
          [
            n("Solidity", "personal"),
            n("Vyper", "alternative"),
            n("Rust", "alternative", "skill-rust"),
            n("Go", "alternative"),
          ],
          n("Programming Languages", "personal")
        ),
        g([n("Remix", "personal"), n("VS Code", "alternative")], n("IDEs", "personal")),
        g(
          [
            n("Foundry", "personal"),
            n("Hardhat", "alternative"),
            n("Truffle", "alternative"),
            n("Brownie", "alternative"),
          ],
          n("Smart Contract Frameworks", "personal")
        ),
        g([n("OpenZeppelin", "personal")], n("Management Platform", "personal")),
      ],
      noteAfter:
        "Make sure you understand smart contract security before deploying to mainnet. A single vulnerability in an immutable contract can lead to irreversible loss of funds.",
      projectIdea: "ERC-20 / ERC-721 Token & Staking Contract",
    }),
    stage("Security", {
      left: [
        g([
          n("Crypto Wallets", "personal"),
          n("Crypto Faucets", "personal"),
          n("Decentralized Storage", "personal"),
        ]),
        g(
          [
            n("Fuzz Testing & Static Analysis", "personal"),
            n("Common Threat Vectors", "personal"),
            n("Source of Randomness Attacks", "personal"),
          ],
          n("Practices", "personal")
        ),
      ],
      right: [
        g([n("Git", "personal", "skill-git-github")], n("Version Control", "personal")),
        g(
          [
            n("GitHub", "personal", "skill-git-github"),
            n("GitLab", "alternative"),
            n("Bitbucket", "alternative"),
          ],
          n("Repo Hosting Services", "personal")
        ),
        g(
          [
            n("Slither", "personal"),
            n("Echidna", "alternative"),
            n("Diligent Fuzzing", "alternative"),
          ],
          n("Security Tools", "personal")
        ),
      ],
    }),
  ],
};

const DAPPS_AND_ORACLES: BlockchainRoadmapSection = {
  id: "dapps-and-oracles",
  title: "Oracles & Decentralized Applications",
  stages: [
    stage("Oracles", {
      right: [
        g([
          n("Hybrid Smart Contracts", "personal"),
          n("Chainlink", "personal"),
          n("Oracle Networks", "personal"),
        ]),
      ],
    }),
    stage("dApps", {
      customId: "dapps",
      left: [
        g(
          [
            n("JavaScript", "personal", "skill-javascript"),
            n("Python", "alternative", "skill-python"),
          ],
          n("Supporting Languages", "personal")
        ),
        g(
          [
            n("React", "personal", "skill-react"),
            n("Angular", "alternative", "skill-angular"),
            n("Vue", "alternative", "skill-vue"),
          ],
          n("Frontend Frameworks", "personal")
        ),
        g(
          [n("ethers.js", "personal"), n("web3.js", "alternative"), n("Moralis", "alternative")],
          n("Client Libraries", "personal")
        ),
      ],
      right: [
        g([
          n("Architecture", "personal"),
          n("Testing", "personal", undefined, "dapp-testing"),
          n("Security", "personal", undefined, "dapp-security"),
          n("Deployment", "personal", undefined, "dapp-deployment"),
          n("Maintenance", "personal"),
        ]),
      ],
      projectIdea: "Full-Stack Web3 DApp with Wallet Connection & Events",
    }),
  ],
};

const SCALING_AND_ECOSYSTEM: BlockchainRoadmapSection = {
  id: "scaling-and-ecosystem",
  title: "Scaling & Ecosystem",
  stages: [
    stage("Building for Scale", {
      status: "optional",
      left: [
        g(
          [
            n("Geth", "personal"),
            n("Besu", "personal"),
            n("Nethermind", "personal"),
            n("Substrate", "personal"),
          ],
          n("Client Nodes", "personal")
        ),
        g(
          [
            n("Alchemy", "personal"),
            n("Infura", "personal"),
            n("Pokt Network", "optional"),
            n("Quicknode", "optional"),
          ],
          n("Node as a Service", "personal")
        ),
        g(
          [
            n("Defi", "personal"),
            n("DAOs", "personal"),
            n("NFTs", "personal"),
            n("Payments", "alternative"),
            n("Insurance", "alternative"),
          ],
          n("Applicability", "personal")
        ),
      ],
      right: [
        g([
          n("State & Payment Channels", "personal"),
          n("Optimistic Rollups & Fraud Proofs", "personal"),
          n("Zk Rollups & Zero Knowledge Proof", "personal"),
          n("Validium", "personal"),
          n("Plasma", "personal"),
          n("Sidechains", "personal"),
          n("Ethereum 2.0", "personal"),
          n("On-Chain Scaling", "personal"),
        ]),
      ],
      noteAfter:
        "Scalability is central to blockchain adoption. Layer 2 rollups and modular data availability layers are the leading paradigm for high-throughput decentralized applications.",
    }),
  ],
};

export const BLOCKCHAIN_SECTIONS: BlockchainRoadmapSection[] = [
  FOUNDATIONS,
  SMART_CONTRACTS_SECTION,
  DAPPS_AND_ORACLES,
  SCALING_AND_ECOSYSTEM,
];

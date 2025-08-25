import { StacksTestnet } from '@stacks/network';
import { 
  makeContractCall,
  broadcastTransaction,
  AnchorMode,
  PostConditionMode,
  stringAsciiCV,
  uintCV,
  principalCV,
  boolCV,
} from '@stacks/transactions';

// Example interaction with the proposal tracker contract
const NETWORK = new StacksTestnet();
const CONTRACT_ADDRESS = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'; // Replace with actual address
const CONTRACT_NAME = 'proposal-tracker';
const PRIVATE_KEY = process.env.PRIVATE_KEY || '';

// Example 1: Create a new SIP-031 grant proposal
async function createProposal() {
  const txOptions = {
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACT_NAME,
    functionName: 'create-proposal',
    functionArgs: [
      stringAsciiCV('sBTC Bridge Security Audit'),
      stringAsciiCV('Comprehensive security audit of sBTC bridge contracts to ensure safe Bitcoin transfers'),
      uintCV(50000000000), // 500 STX
      principalCV('ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG'), // recipient
      stringAsciiCV('Security'),
      stringAsciiCV('https://forum.stacks.org/t/sbtc-bridge-audit-proposal'),
      stringAsciiCV('https://github.com/stacks-network/sbtc'),
      stringAsciiCV('M1: Contract analysis; M2: Vulnerability testing; M3: Final report')
    ],
    senderKey: PRIVATE_KEY,
    network: NETWORK,
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow,
  };

  const transaction = await makeContractCall(txOptions);
  const broadcastResponse = await broadcastTransaction(transaction, NETWORK);
  
  console.log('Proposal created:', broadcastResponse.txid);
  return broadcastResponse;
}

// Example 2: Activate a proposal for voting
async function activateProposal(proposalId: number) {
  const txOptions = {
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACT_NAME,
    functionName: 'activate-proposal',
    functionArgs: [uintCV(proposalId)],
    senderKey: PRIVATE_KEY,
    network: NETWORK,
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow,
  };

  const transaction = await makeContractCall(txOptions);
  const broadcastResponse = await broadcastTransaction(transaction, NETWORK);
  
  console.log('Proposal activated:', broadcastResponse.txid);
  return broadcastResponse;
}

// Example 3: Vote on a proposal with STX weighting
async function voteOnProposal(proposalId: number, voteYes: boolean, stxAmount: number) {
  const txOptions = {
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACT_NAME,
    functionName: 'vote',
    functionArgs: [
      uintCV(proposalId),
      boolCV(voteYes),
      uintCV(stxAmount * 1000000) // Convert to microSTX
    ],
    senderKey: PRIVATE_KEY,
    network: NETWORK,
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow,
  };

  const transaction = await makeContractCall(txOptions);
  const broadcastResponse = await broadcastTransaction(transaction, NETWORK);
  
  console.log('Vote cast:', broadcastResponse.txid);
  return broadcastResponse;
}

// Example 4: Update governance parameters (owner only)
async function updateGovernanceParameters() {
  const txOptions = {
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACT_NAME,
    functionName: 'update-voting-parameters',
    functionArgs: [
      uintCV(20000000000), // 200 STX min threshold
      uintCV(2016),        // 2 weeks voting period
      uintCV(288),         // 2 days execution delay
      uintCV(50000000000)  // 500 STX quorum
    ],
    senderKey: PRIVATE_KEY,
    network: NETWORK,
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow,
  };

  const transaction = await makeContractCall(txOptions);
  const broadcastResponse = await broadcastTransaction(transaction, NETWORK);
  
  console.log('Parameters updated:', broadcastResponse.txid);
  return broadcastResponse;
}

// Example usage scenarios for SIP-031 grant proposals
const exampleProposals = [
  {
    title: 'DeFi Liquidity Incentives',
    description: 'Bootstrap liquidity for sBTC/STX pairs across major DEXs',
    funding: 1000, // STX
    category: 'DeFi',
    forum: 'https://forum.stacks.org/t/defi-liquidity-incentives',
    github: 'https://github.com/project/defi-liquidity',
    milestones: 'M1: DEX integration; M2: Liquidity deployment; M3: Analytics dashboard'
  },
  {
    title: 'Developer Education Platform',
    description: 'Create comprehensive Bitcoin L2 development tutorials and tools',
    funding: 300, // STX
    category: 'Education',
    forum: 'https://forum.stacks.org/t/dev-education-platform',
    github: 'https://github.com/project/dev-education',
    milestones: 'M1: Content creation; M2: Platform development; M3: Community launch'
  },
  {
    title: 'Core Protocol Enhancement',
    description: 'Implement performance optimizations for Stacks consensus',
    funding: 2000, // STX
    category: 'Core',
    forum: 'https://forum.stacks.org/t/protocol-enhancement',
    github: 'https://github.com/stacks-network/stacks-core',
    milestones: 'M1: Research & design; M2: Implementation; M3: Testing & deployment'
  }
];

// Demo function to showcase the full proposal lifecycle
async function demonstrateProposalLifecycle() {
  console.log('=== SIP-031 Grant Proposal Tracker Demo ===\n');
  
  try {
    // Step 1: Create proposal
    console.log('1. Creating new grant proposal...');
    const createResponse = await createProposal();
    
    // Step 2: Activate proposal
    console.log('2. Activating proposal for voting...');
    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for confirmation
    const activateResponse = await activateProposal(0);
    
    // Step 3: Cast votes
    console.log('3. Casting votes...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    await voteOnProposal(0, true, 100); // Vote yes with 100 STX
    
    console.log('\nDemo completed! Check the Stacks explorer for transaction details.');
    
  } catch (error) {
    console.error('Demo error:', error);
  }
}

// Export functions for use in other scripts
export {
  createProposal,
  activateProposal,
  voteOnProposal,
  updateGovernanceParameters,
  demonstrateProposalLifecycle,
  exampleProposals
};

// Run demo if script is executed directly
if (require.main === module) {
  demonstrateProposalLifecycle();
}

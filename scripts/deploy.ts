import { StacksTestnet, StacksMainnet } from '@stacks/network';
import { 
  makeContractDeploy,
  broadcastTransaction,
  AnchorMode,
  PostConditionMode,
} from '@stacks/transactions';
import { readFileSync } from 'fs';

// Configuration
const NETWORK = process.env.NETWORK === 'mainnet' ? new StacksMainnet() : new StacksTestnet();
const PRIVATE_KEY = process.env.PRIVATE_KEY || '';
const CONTRACT_NAME = 'proposal-tracker';

async function deployContract() {
  if (!PRIVATE_KEY) {
    console.error('Please set PRIVATE_KEY environment variable');
    process.exit(1);
  }

  try {
    // Read contract source
    const contractSource = readFileSync('./contracts/proposal-tracker.clar', 'utf8');
    
    // Create deployment transaction
    const txOptions = {
      contractName: CONTRACT_NAME,
      codeBody: contractSource,
      senderKey: PRIVATE_KEY,
      network: NETWORK,
      anchorMode: AnchorMode.Any,
      postConditionMode: PostConditionMode.Allow,
    };

    const transaction = await makeContractDeploy(txOptions);
    
    // Broadcast transaction
    const broadcastResponse = await broadcastTransaction(transaction, NETWORK);
    
    if (broadcastResponse.error) {
      console.error('Deployment failed:', broadcastResponse.error);
      console.error('Reason:', broadcastResponse.reason);
      process.exit(1);
    }

    console.log('Contract deployed successfully!');
    console.log('Transaction ID:', broadcastResponse.txid);
    console.log('Network:', NETWORK.isMainnet() ? 'mainnet' : 'testnet');
    
    // Wait for confirmation
    console.log('Waiting for confirmation...');
    const explorerUrl = NETWORK.isMainnet() 
      ? `https://explorer.stacks.co/txid/${broadcastResponse.txid}`
      : `https://explorer.stacks.co/txid/${broadcastResponse.txid}?chain=testnet`;
    
    console.log('View transaction:', explorerUrl);
    
  } catch (error) {
    console.error('Deployment error:', error);
    process.exit(1);
  }
}

// Initialize governance parameters after deployment
async function initializeGovernance() {
  console.log('\nInitializing governance parameters...');
  console.log('Default settings:');
  console.log('- Min proposal threshold: 10 STX');
  console.log('- Voting period: 1008 blocks (~1 week)');
  console.log('- Execution delay: 144 blocks (~1 day)');
  console.log('- Quorum threshold: 100 STX');
  console.log('\nUse update-voting-parameters function to modify these settings.');
}

// Main execution
if (require.main === module) {
  deployContract()
    .then(() => initializeGovernance())
    .catch(console.error);
}

export { deployContract, initializeGovernance };

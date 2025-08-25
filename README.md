# SIP-031 Grant Proposal Tracker

A comprehensive Clarity smart contract for tracking and voting on SIP-031 grant proposals on the Stacks blockchain. This dApp enables transparent, on-chain governance for Bitcoin L2 ecosystem funding.

## Features

### Core Functionality
- **Proposal Creation**: Submit detailed grant proposals with metadata
- **STX-Weighted Voting**: Vote with STX holdings for proportional governance
- **Proposal Lifecycle**: Draft → Active → Passed/Rejected → Executed
- **Governance Controls**: Configurable voting parameters and thresholds

### SIP-031 Compliance
- **Grant Categories**: DeFi, Core, Security, Education, Infrastructure
- **Funding Tracking**: Specify funding amounts and recipients
- **Forum Integration**: Link to Stacks Forum discussions
- **GitHub Integration**: Connect to project repositories
- **Milestone Tracking**: Define project milestones and deliverables

### Security Features
- **Double Vote Prevention**: Each address can only vote once per proposal
- **Quorum Requirements**: Minimum STX participation for valid proposals
- **Execution Delays**: Time-locked execution for security
- **Owner Controls**: Administrative functions for governance parameters

## Contract Structure

### Data Maps
- `proposals`: Core proposal data with voting results
- `votes`: Individual vote records with STX amounts
- `proposal-metadata`: Extended metadata (forum links, milestones)
- `voter-weights`: STX balance tracking for voting power

### Key Functions

#### Proposal Management
- `create-proposal`: Submit new grant proposal with full metadata
- `activate-proposal`: Move proposal from draft to active voting
- `finalize-proposal`: Calculate results after voting period
- `execute-proposal`: Execute passed proposals after delay

#### Voting System
- `vote`: Cast weighted vote with STX amount
- `get-vote-counts`: Retrieve voting statistics
- `get-vote`: Check individual vote records

#### Governance
- `update-voting-parameters`: Adjust voting thresholds and periods
- `get-voting-parameters`: View current governance settings

## Usage Examples

### Creating a Grant Proposal
```clarity
(contract-call? .proposal-tracker create-proposal
  "sBTC Integration Grant"
  "Develop sBTC integration for DeFi protocols"
  u50000000000  ;; 500 STX funding
  'SP1234...     ;; recipient address
  "DeFi"
  "https://forum.stacks.org/t/sbtc-integration"
  "https://github.com/project/sbtc-integration"
  "M1: Smart contracts; M2: Testing; M3: Deployment")
```

### Voting on Proposals
```clarity
(contract-call? .proposal-tracker vote
  u0           ;; proposal ID
  true         ;; yes vote
  u5000000000) ;; 50 STX voting weight
```

## Governance Parameters

### Default Settings
- **Minimum Proposal Threshold**: 10 STX (prevents spam)
- **Voting Period**: 1008 blocks (~1 week)
- **Execution Delay**: 144 blocks (~1 day)
- **Quorum Threshold**: 100 STX minimum participation

### Proposal Categories
- **DeFi**: Decentralized finance protocols and liquidity
- **Core**: Protocol upgrades and infrastructure
- **Security**: Audits and security improvements
- **Education**: Developer resources and documentation
- **Infrastructure**: Tools and ecosystem support

## Testing

The contract includes comprehensive tests covering:
- Proposal creation with metadata
- Voting mechanics and STX weighting
- Double vote prevention
- Governance parameter updates
- Proposal lifecycle management

Run tests with:
```bash
clarinet test
```

## SIP-031 Integration

This contract supports the SIP-031 Stacks Endowment goals:
- **Transparent Governance**: On-chain voting with public records
- **Community Participation**: STX-weighted voting for stakeholder input
- **Grant Management**: Structured proposal process with milestones
- **Ecosystem Growth**: Support for DeFi, infrastructure, and education
- **Bitcoin L2 Focus**: Emphasis on sBTC and Bitcoin integration projects

## Deployment

1. Deploy contract to Stacks testnet/mainnet
2. Configure governance parameters via `update-voting-parameters`
3. Begin accepting grant proposals from community
4. Integrate with Stacks Forum for discussion
5. Monitor proposal lifecycle and execution

## Security Considerations

- Proposals require minimum STX threshold to prevent spam
- Voting periods provide adequate time for community review
- Execution delays allow for emergency intervention if needed
- STX weighting ensures stakeholder alignment
- Double vote prevention maintains voting integrity

## Future Enhancements

- Integration with Stacks API for off-chain data
- Automated milestone tracking and payments
- Multi-signature execution for large grants
- Integration with existing Stacks governance tools
- Enhanced metadata and proposal templates

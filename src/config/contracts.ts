export const USDT_CONTRACTS = {
  // Ethereum Mainnet
  1: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  // Sepolia Testnet - Using a mock USDT address for testing
  11155111: '0x7169D38820dfd117C3FA1f22a697dBA58d90BA06',
  // Polygon Mainnet  
  137: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
  // BSC Mainnet
  56: '0x55d398326f99059fF775485246999027B3197955',
} as const;

export const USDT_ABI = [
  // Transfer event
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  // ERC20 standard functions
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
] as const;

export const getUSDTAddress = (chainId: number): string | null => {
  return USDT_CONTRACTS[chainId as keyof typeof USDT_CONTRACTS] || null;
};

export const SUPPORTED_NETWORKS = {
  1: { name: 'Ethereum', symbol: 'ETH', decimals: 6 },
  11155111: { name: 'Sepolia', symbol: 'ETH', decimals: 6 },
  137: { name: 'Polygon', symbol: 'MATIC', decimals: 6 },
  56: { name: 'BSC', symbol: 'BNB', decimals: 18 },
} as const;
import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { TokenConfig } from './useTokenManager';

export interface ERC20Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  formattedValue: string;
  timestamp: number;
  blockNumber: number;
  chainId: number;
  networkName: string;
  tokenSymbol: string;
  tokenName: string;
  tokenAddress: string;
  tokenDecimals: number;
}

interface UseERC20TransactionsProps {
  account: string | null;
  provider: ethers.BrowserProvider | null;
  chainId: number | null;
  isConnected: boolean;
  activeTokens: TokenConfig[];
}

const ERC20_ABI = [
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
];

export const useERC20Transactions = ({ 
  account, 
  provider, 
  chainId, 
  isConnected,
  activeTokens 
}: UseERC20TransactionsProps) => {
  const [transactions, setTransactions] = useState<ERC20Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [listeners, setListeners] = useState<Map<string, any>>(new Map());

  const getNetworkName = useCallback((chainId: number): string => {
    const networks: { [key: number]: string } = {
      1: 'Ethereum',
      11155111: 'Sepolia',
      137: 'Polygon',
      56: 'BSC',
    };
    return networks[chainId] || `Chain ${chainId}`;
  }, []);

  const formatTokenValue = useCallback((value: string, decimals: number): string => {
    const formatted = ethers.formatUnits(value, decimals);
    const num = parseFloat(formatted);
    if (num >= 1000000) {
      return (num / 1000000).toFixed(2) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(2) + 'K';
    }
    return num.toFixed(4);
  }, []);

  const fetchHistoricalTransactions = useCallback(async () => {
    if (!account || !provider || !chainId || activeTokens.length === 0) return;

    setIsLoading(true);
    setError(null);

    try {
      const currentBlock = await provider.getBlockNumber();
      const fromBlock = Math.max(0, currentBlock - 1000);

      const transactionPromises = activeTokens.map(async (token) => {
        try {
          const contract = new ethers.Contract(token.address, ERC20_ABI, provider);
          const filter = contract.filters.Transfer(null, account);
          const events = await contract.queryFilter(filter, fromBlock, currentBlock);

          const tokenTransactions = await Promise.all(
            events.slice(-5).map(async (event) => {
              try {
                const block = await provider.getBlock(event.blockNumber);
                return {
                  hash: event.transactionHash,
                  from: event.args![0] as string,
                  to: event.args![1] as string,
                  value: event.args![2].toString(),
                  formattedValue: formatTokenValue(event.args![2].toString(), token.decimals),
                  timestamp: block?.timestamp ? block.timestamp * 1000 : Date.now(),
                  blockNumber: event.blockNumber,
                  chainId,
                  networkName: getNetworkName(chainId),
                  tokenSymbol: token.symbol,
                  tokenName: token.name,
                  tokenAddress: token.address,
                  tokenDecimals: token.decimals,
                };
              } catch (error) {
                console.error('Error processing event:', error);
                return null;
              }
            })
          );

          return tokenTransactions.filter(tx => tx !== null) as ERC20Transaction[];
        } catch (error) {
          console.error(`Error fetching transactions for ${token.symbol}:`, error);
          return [];
        }
      });

      const allTransactions = (await Promise.all(transactionPromises)).flat();
      
      setTransactions(prev => {
        const existingHashes = new Set(prev.map(tx => `${tx.hash}-${tx.tokenAddress}`));
        const newTxs = allTransactions.filter(tx => 
          !existingHashes.has(`${tx.hash}-${tx.tokenAddress}`)
        );
        
        return [...prev, ...newTxs]
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, 50);
      });

    } catch (error: any) {
      console.error('Error fetching ERC20 transactions:', error);
      setError('Failed to fetch transaction history');
    } finally {
      setIsLoading(false);
    }
  }, [account, provider, chainId, activeTokens, formatTokenValue, getNetworkName]);

  const startListening = useCallback(async () => {
    if (!account || !provider || !chainId || activeTokens.length === 0) return;

    // Stop existing listeners
    listeners.forEach((listener, key) => {
      try {
        const [contract] = listener;
        contract.removeAllListeners();
      } catch (error) {
        console.error('Error removing listener:', error);
      }
    });
    listeners.clear();

    try {
      const newListeners = new Map();

      for (const token of activeTokens) {
        const contract = new ethers.Contract(token.address, ERC20_ABI, provider);
        const filter = contract.filters.Transfer(null, account);

        const handleTransfer = async (from: string, to: string, value: bigint, event: any) => {
          try {
            const block = await provider.getBlock(event.blockNumber);
            const newTransaction: ERC20Transaction = {
              hash: event.transactionHash,
              from,
              to,
              value: value.toString(),
              formattedValue: formatTokenValue(value.toString(), token.decimals),
              timestamp: block?.timestamp ? block.timestamp * 1000 : Date.now(),
              blockNumber: event.blockNumber,
              chainId,
              networkName: getNetworkName(chainId),
              tokenSymbol: token.symbol,
              tokenName: token.name,
              tokenAddress: token.address,
              tokenDecimals: token.decimals,
            };

            setTransactions(prev => {
              const existingHashes = new Set(prev.map(tx => `${tx.hash}-${tx.tokenAddress}`));
              if (existingHashes.has(`${newTransaction.hash}-${newTransaction.tokenAddress}`)) {
                return prev;
              }
              
              return [newTransaction, ...prev].slice(0, 50);
            });

            // Show notification
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification(`${token.symbol} Received!`, {
                body: `Received ${newTransaction.formattedValue} ${token.symbol} from ${from.substring(0, 6)}...${from.substring(from.length - 4)}`,
                icon: '/favicon.ico',
              });
            }
          } catch (error) {
            console.error('Error processing new transfer:', error);
          }
        };

        contract.on(filter, handleTransfer);
        newListeners.set(token.address, [contract, handleTransfer]);
      }

      setListeners(newListeners);
      setIsListening(true);
      setError(null);

      // Request notification permission
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }

    } catch (error: any) {
      console.error('Error starting listeners:', error);
      setError('Failed to start transaction monitoring');
    }
  }, [account, provider, chainId, activeTokens, formatTokenValue, getNetworkName, listeners]);

  const stopListening = useCallback(() => {
    listeners.forEach((listener) => {
      try {
        const [contract] = listener;
        contract.removeAllListeners();
      } catch (error) {
        console.error('Error stopping listener:', error);
      }
    });
    listeners.clear();
    setIsListening(false);
  }, [listeners]);

  // Effect to handle connection and token changes
  useEffect(() => {
    if (isConnected && account && provider && chainId && activeTokens.length > 0) {
      fetchHistoricalTransactions();
      startListening();
    } else {
      stopListening();
      if (activeTokens.length === 0) {
        setTransactions([]);
      }
    }

    return () => {
      stopListening();
    };
  }, [isConnected, account, provider, chainId, activeTokens, fetchHistoricalTransactions, startListening, stopListening]);

  return {
    transactions,
    isLoading,
    error,
    isListening,
    refetch: fetchHistoricalTransactions,
    monitoredTokens: activeTokens.length,
  };
};
import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { getUSDTAddress, USDT_ABI, SUPPORTED_NETWORKS } from '../config/contracts';

export interface USDTTransaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  formattedValue: string;
  timestamp: number;
  blockNumber: number;
  chainId: number;
  networkName: string;
}

interface UseUSDTTransactionsProps {
  account: string | null;
  provider: ethers.BrowserProvider | null;
  chainId: number | null;
  isConnected: boolean;
}

export const useUSDTTransactions = ({ 
  account, 
  provider, 
  chainId, 
  isConnected 
}: UseUSDTTransactionsProps) => {
  const [transactions, setTransactions] = useState<USDTTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);

  const formatUSDTValue = useCallback((value: string, chainId: number): string => {
    const decimals = SUPPORTED_NETWORKS[chainId as keyof typeof SUPPORTED_NETWORKS]?.decimals || 6;
    const formatted = ethers.formatUnits(value, decimals);
    return parseFloat(formatted).toFixed(2);
  }, []);

  const getNetworkName = useCallback((chainId: number): string => {
    return SUPPORTED_NETWORKS[chainId as keyof typeof SUPPORTED_NETWORKS]?.name || `Chain ${chainId}`;
  }, []);

  const fetchHistoricalTransactions = useCallback(async () => {
    if (!account || !provider || !chainId) return;

    const usdtAddress = getUSDTAddress(chainId);
    if (!usdtAddress) {
      setError(`USDT not supported on ${getNetworkName(chainId)}`);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const contract = new ethers.Contract(usdtAddress, USDT_ABI, provider);
      
      // Get recent blocks (last 1000 blocks to avoid rate limits)
      const currentBlock = await provider.getBlockNumber();
      const fromBlock = Math.max(0, currentBlock - 1000);

      // Query Transfer events to the connected account
      const filter = contract.filters.Transfer(null, account);
      const events = await contract.queryFilter(filter, fromBlock, currentBlock);

      const transactionPromises = events.slice(-10).map(async (event) => {
        const block = await provider.getBlock(event.blockNumber);
        return {
          hash: event.transactionHash,
          from: event.args![0] as string,
          to: event.args![1] as string,
          value: event.args![2].toString(),
          formattedValue: formatUSDTValue(event.args![2].toString(), chainId),
          timestamp: block?.timestamp ? block.timestamp * 1000 : Date.now(),
          blockNumber: event.blockNumber,
          chainId,
          networkName: getNetworkName(chainId),
        };
      });

      const txs = await Promise.all(transactionPromises);
      setTransactions(prev => {
        const existingHashes = new Set(prev.map(tx => tx.hash));
        const newTxs = txs.filter(tx => !existingHashes.has(tx.hash));
        return [...prev, ...newTxs].sort((a, b) => b.timestamp - a.timestamp).slice(0, 20);
      });

    } catch (error: any) {
      console.error('Error fetching USDT transactions:', error);
      setError('Failed to fetch transaction history');
    } finally {
      setIsLoading(false);
    }
  }, [account, provider, chainId, formatUSDTValue, getNetworkName]);

  const startListening = useCallback(async () => {
    if (!account || !provider || !chainId || isListening) return;

    const usdtAddress = getUSDTAddress(chainId);
    if (!usdtAddress) {
      setError(`USDT not supported on ${getNetworkName(chainId)}`);
      return;
    }

    try {
      const contract = new ethers.Contract(usdtAddress, USDT_ABI, provider);
      
      // Listen for new Transfer events to the connected account
      const filter = contract.filters.Transfer(null, account);
      
      const handleTransfer = async (from: string, to: string, value: bigint, event: any) => {
        try {
          const block = await provider.getBlock(event.blockNumber);
          const newTransaction: USDTTransaction = {
            hash: event.transactionHash,
            from,
            to,
            value: value.toString(),
            formattedValue: formatUSDTValue(value.toString(), chainId),
            timestamp: block?.timestamp ? block.timestamp * 1000 : Date.now(),
            blockNumber: event.blockNumber,
            chainId,
            networkName: getNetworkName(chainId),
          };

          setTransactions(prev => {
            const existingHashes = new Set(prev.map(tx => tx.hash));
            if (existingHashes.has(newTransaction.hash)) return prev;
            
            return [newTransaction, ...prev].slice(0, 20);
          });

          // Show notification for new incoming USDT
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('USDT Received!', {
              body: `Received ${newTransaction.formattedValue} USDT from ${from.substring(0, 6)}...${from.substring(from.length - 4)}`,
              icon: '/favicon.ico',
            });
          }
        } catch (error) {
          console.error('Error processing new transfer:', error);
        }
      };

      contract.on(filter, handleTransfer);
      setIsListening(true);
      setError(null);

      // Request notification permission
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }

      return () => {
        contract.off(filter, handleTransfer);
        setIsListening(false);
      };
    } catch (error: any) {
      console.error('Error starting listener:', error);
      setError('Failed to start transaction monitoring');
    }
  }, [account, provider, chainId, isListening, formatUSDTValue, getNetworkName]);

  const stopListening = useCallback(() => {
    setIsListening(false);
    setTransactions([]);
  }, []);

  // Effect to handle connection changes
  useEffect(() => {
    if (isConnected && account && provider && chainId) {
      fetchHistoricalTransactions();
      const cleanup = startListening();
      
      return () => {
        if (cleanup instanceof Promise) {
          cleanup.then(fn => fn && fn());
        }
      };
    } else {
      stopListening();
    }
  }, [isConnected, account, provider, chainId, fetchHistoricalTransactions, startListening, stopListening]);

  return {
    transactions,
    isLoading,
    error,
    isListening,
    refetch: fetchHistoricalTransactions,
  };
};
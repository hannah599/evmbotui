import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';

declare global {
  interface Window {
    ethereum?: any;
  }
}

export interface WalletState {
  isConnected: boolean;
  account: string | null;
  provider: ethers.BrowserProvider | null;
  chainId: number | null;
  balance: string | null;
  isLoading: boolean;
  error: string | null;
}

export const useWallet = () => {
  const [walletState, setWalletState] = useState<WalletState>({
    isConnected: false,
    account: null,
    provider: null,
    chainId: null,
    balance: null,
    isLoading: false,
    error: null,
  });

  const checkConnection = useCallback(async () => {
    if (!window.ethereum) {
      setWalletState(prev => ({ ...prev, error: 'MetaMask not installed' }));
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.listAccounts();
      
      if (accounts.length > 0) {
        const account = accounts[0].address;
        const network = await provider.getNetwork();
        const balance = await provider.getBalance(account);
        
        setWalletState({
          isConnected: true,
          account,
          provider,
          chainId: Number(network.chainId),
          balance: ethers.formatEther(balance),
          isLoading: false,
          error: null,
        });
      }
    } catch (error) {
      console.error('Error checking connection:', error);
      setWalletState(prev => ({ 
        ...prev, 
        error: 'Failed to check wallet connection',
        isLoading: false 
      }));
    }
  }, []);

  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      setWalletState(prev => ({ ...prev, error: 'MetaMask not installed' }));
      return;
    }

    setWalletState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      await checkConnection();
    } catch (error: any) {
      console.error('Error connecting wallet:', error);
      setWalletState(prev => ({
        ...prev,
        error: error.message || 'Failed to connect wallet',
        isLoading: false,
      }));
    }
  }, [checkConnection]);

  const disconnectWallet = useCallback(() => {
    setWalletState({
      isConnected: false,
      account: null,
      provider: null,
      chainId: null,
      balance: null,
      isLoading: false,
      error: null,
    });
  }, []);

  const switchNetwork = useCallback(async (chainId: string) => {
    if (!window.ethereum) return;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId }],
      });
      await checkConnection();
    } catch (error: any) {
      console.error('Error switching network:', error);
      setWalletState(prev => ({
        ...prev,
        error: error.message || 'Failed to switch network',
      }));
    }
  }, [checkConnection]);

  useEffect(() => {
    checkConnection();

    if (window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else {
          checkConnection();
        }
      };

      const handleChainChanged = () => {
        checkConnection();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [checkConnection, disconnectWallet]);

  return {
    ...walletState,
    connectWallet,
    disconnectWallet,
    switchNetwork,
  };
};
import { useState, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';

export interface TokenConfig {
  id: string;
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  chainId: number;
  isActive: boolean;
  addedAt: number;
}

export interface TokenValidation {
  isValid: boolean;
  error?: string;
  tokenInfo?: {
    symbol: string;
    name: string;
    decimals: number;
  };
}

const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)", 
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "event Transfer(address indexed from, address indexed to, uint256 value)"
];

export const useTokenManager = (provider: ethers.BrowserProvider | null, chainId: number | null) => {
  const [tokens, setTokens] = useState<TokenConfig[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load tokens from localStorage
  const loadTokens = useCallback(() => {
    const stored = localStorage.getItem('evmbot_tokens');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setTokens(parsed);
      } catch (error) {
        console.error('Error loading tokens from storage:', error);
      }
    }
  }, []);

  // Save tokens to localStorage
  const saveTokens = useCallback((newTokens: TokenConfig[]) => {
    localStorage.setItem('evmbot_tokens', JSON.stringify(newTokens));
    setTokens(newTokens);
  }, []);

  // Validate token contract
  const validateToken = useCallback(async (address: string): Promise<TokenValidation> => {
    if (!provider || !chainId) {
      return { isValid: false, error: 'Wallet not connected' };
    }

    if (!ethers.isAddress(address)) {
      return { isValid: false, error: 'Invalid contract address' };
    }

    try {
      const contract = new ethers.Contract(address, ERC20_ABI, provider);
      
      // Try to call ERC20 functions to validate
      const [symbol, name, decimals] = await Promise.all([
        contract.symbol(),
        contract.name(),
        contract.decimals()
      ]);

      return {
        isValid: true,
        tokenInfo: {
          symbol: symbol as string,
          name: name as string,
          decimals: Number(decimals)
        }
      };
    } catch (error: any) {
      console.error('Token validation error:', error);
      return { 
        isValid: false, 
        error: 'Not a valid ERC20 token or network error' 
      };
    }
  }, [provider, chainId]);

  // Add new token
  const addToken = useCallback(async (address: string): Promise<{ success: boolean; error?: string }> => {
    if (!chainId) {
      return { success: false, error: 'No chain selected' };
    }

    setIsLoading(true);

    try {
      // Check if token already exists
      const existing = tokens.find(t => 
        t.address.toLowerCase() === address.toLowerCase() && 
        t.chainId === chainId
      );

      if (existing) {
        setIsLoading(false);
        return { success: false, error: 'Token already added for this network' };
      }

      // Validate token
      const validation = await validateToken(address);
      if (!validation.isValid) {
        setIsLoading(false);
        return { success: false, error: validation.error };
      }

      // Create new token config
      const newToken: TokenConfig = {
        id: `${address}-${chainId}-${Date.now()}`,
        address: address.toLowerCase(),
        symbol: validation.tokenInfo!.symbol,
        name: validation.tokenInfo!.name,
        decimals: validation.tokenInfo!.decimals,
        chainId,
        isActive: true,
        addedAt: Date.now()
      };

      const updatedTokens = [...tokens, newToken];
      saveTokens(updatedTokens);
      
      setIsLoading(false);
      return { success: true };
    } catch (error: any) {
      setIsLoading(false);
      return { success: false, error: error.message || 'Failed to add token' };
    }
  }, [tokens, chainId, validateToken, saveTokens]);

  // Remove token
  const removeToken = useCallback((tokenId: string) => {
    const updatedTokens = tokens.filter(t => t.id !== tokenId);
    saveTokens(updatedTokens);
  }, [tokens, saveTokens]);

  // Toggle token monitoring
  const toggleToken = useCallback((tokenId: string) => {
    const updatedTokens = tokens.map(t => 
      t.id === tokenId ? { ...t, isActive: !t.isActive } : t
    );
    saveTokens(updatedTokens);
  }, [tokens, saveTokens]);

  // Get active tokens for current chain
  const getActiveTokens = useCallback(() => {
    return tokens.filter(t => t.chainId === chainId && t.isActive);
  }, [tokens, chainId]);

  // Get all tokens for current chain
  const getChainTokens = useCallback(() => {
    return tokens.filter(t => t.chainId === chainId);
  }, [tokens, chainId]);

  // Load tokens on mount
  useEffect(() => {
    loadTokens();
  }, [loadTokens]);

  return {
    tokens,
    activeTokens: getActiveTokens(),
    chainTokens: getChainTokens(),
    isLoading,
    addToken,
    removeToken,
    toggleToken,
    validateToken
  };
};
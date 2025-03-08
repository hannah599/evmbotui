import React, { useState } from 'react';
import { useTokenManager, TokenConfig } from '../hooks/useTokenManager';
import './TokenManager.css';

interface TokenManagerProps {
  provider: any;
  chainId: number | null;
  isConnected: boolean;
}

const TokenManager: React.FC<TokenManagerProps> = ({
  provider,
  chainId,
  isConnected,
}) => {
  const {
    chainTokens,
    activeTokens,
    isLoading,
    addToken,
    removeToken,
    toggleToken,
  } = useTokenManager(provider, chainId);

  const [newTokenAddress, setNewTokenAddress] = useState('');
  const [addingToken, setAddingToken] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAddToken = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newTokenAddress.trim()) {
      setError('Please enter a token contract address');
      return;
    }

    setAddingToken(true);
    setError(null);

    const result = await addToken(newTokenAddress.trim());
    
    if (result.success) {
      setNewTokenAddress('');
      setShowAddForm(false);
    } else {
      setError(result.error || 'Failed to add token');
    }
    
    setAddingToken(false);
  };

  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const getNetworkName = (chainId: number) => {
    const networks: { [key: number]: string } = {
      1: 'Ethereum',
      11155111: 'Sepolia',
      137: 'Polygon',
      56: 'BSC',
    };
    return networks[chainId] || `Chain ${chainId}`;
  };

  if (!isConnected) {
    return (
      <div className="token-manager">
        <div className="token-manager-header">
          <h3>🪙 Token Manager</h3>
          <p className="connect-message">Connect your wallet to manage ERC20 tokens</p>
        </div>
      </div>
    );
  }

  return (
    <div className="token-manager">
      <div className="token-manager-header">
        <h3>🪙 Token Manager</h3>
        <div className="header-actions">
          <span className="network-indicator">
            Network: {chainId ? getNetworkName(chainId) : 'Unknown'}
          </span>
          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="add-token-button"
            disabled={!chainId}
          >
            {showAddForm ? 'Cancel' : '+ Add Token'}
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className="add-token-form">
          <h4>Add ERC20 Token</h4>
          <form onSubmit={handleAddToken}>
            <div className="form-group">
              <label htmlFor="tokenAddress">Token Contract Address:</label>
              <input
                id="tokenAddress"
                type="text"
                value={newTokenAddress}
                onChange={(e) => setNewTokenAddress(e.target.value)}
                placeholder="0x..."
                className="token-input"
                disabled={addingToken}
              />
            </div>
            
            {error && (
              <div className="error-message">
                ❌ {error}
              </div>
            )}
            
            <div className="form-actions">
              <button 
                type="submit" 
                disabled={addingToken || !newTokenAddress.trim()}
                className="submit-button"
              >
                {addingToken ? '🔍 Validating...' : 'Add Token'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="tokens-section">
        <div className="section-header">
          <h4>Configured Tokens ({chainTokens.length})</h4>
          <p className="section-subtitle">
            {activeTokens.length} active • {chainTokens.length - activeTokens.length} inactive
          </p>
        </div>

        {chainTokens.length === 0 ? (
          <div className="no-tokens">
            <p>No tokens configured for this network</p>
            <small>Add ERC20 tokens to start monitoring their transactions</small>
          </div>
        ) : (
          <div className="tokens-list">
            {chainTokens.map((token: TokenConfig) => (
              <div key={token.id} className={`token-item ${token.isActive ? 'active' : 'inactive'}`}>
                <div className="token-info">
                  <div className="token-main">
                    <span className="token-symbol">{token.symbol}</span>
                    <span className="token-name">{token.name}</span>
                  </div>
                  <div className="token-details">
                    <span className="token-address">
                      Contract: {formatAddress(token.address)}
                    </span>
                    <span className="token-decimals">
                      Decimals: {token.decimals}
                    </span>
                  </div>
                </div>
                
                <div className="token-actions">
                  <button
                    onClick={() => toggleToken(token.id)}
                    className={`toggle-button ${token.isActive ? 'active' : 'inactive'}`}
                  >
                    {token.isActive ? '🟢 Active' : '⚫ Inactive'}
                  </button>
                  <button
                    onClick={() => removeToken(token.id)}
                    className="remove-button"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {activeTokens.length > 0 && (
        <div className="monitoring-info">
          <h4>🔍 Currently Monitoring</h4>
          <div className="monitoring-tokens">
            {activeTokens.map((token: TokenConfig) => (
              <span key={token.id} className="monitoring-token">
                {token.symbol}
              </span>
            ))}
          </div>
          <p className="monitoring-note">
            Incoming transfers for these tokens will be displayed in the transactions section
          </p>
        </div>
      )}
    </div>
  );
};

export default TokenManager;
import React from 'react';
import { useERC20Transactions, ERC20Transaction } from '../hooks/useERC20Transactions';
import { TokenConfig } from '../hooks/useTokenManager';
import './TokenTransactions.css';

interface TokenTransactionsProps {
  account: string | null;
  provider: any;
  chainId: number | null;
  isConnected: boolean;
  activeTokens: TokenConfig[];
}

const TokenTransactions: React.FC<TokenTransactionsProps> = ({
  account,
  provider,
  chainId,
  isConnected,
  activeTokens,
}) => {
  const { 
    transactions, 
    isLoading, 
    error, 
    isListening, 
    refetch,
    monitoredTokens 
  } = useERC20Transactions({
    account,
    provider,
    chainId,
    isConnected,
    activeTokens,
  });

  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const getExplorerUrl = (hash: string, chainId: number) => {
    const explorers = {
      1: 'https://etherscan.io/tx/',
      11155111: 'https://sepolia.etherscan.io/tx/',
      137: 'https://polygonscan.com/tx/',
      56: 'https://bscscan.com/tx/',
    };
    const baseUrl = explorers[chainId as keyof typeof explorers];
    return baseUrl ? `${baseUrl}${hash}` : '#';
  };

  const getTokenIcon = (symbol: string) => {
    const icons: { [key: string]: string } = {
      'USDT': '💵',
      'USDC': '💰',
      'DAI': '🟡',
      'WETH': '🔷',
      'WBTC': '🟠',
      'UNI': '🦄',
      'LINK': '🔗',
      'MATIC': '🟣',
    };
    return icons[symbol.toUpperCase()] || '🪙';
  };

  if (!isConnected) {
    return (
      <div className="token-transactions">
        <div className="transactions-header">
          <h3>🪙 Token Transactions</h3>
          <p className="connect-message">Connect your wallet to monitor ERC20 token transactions</p>
        </div>
      </div>
    );
  }

  return (
    <div className="token-transactions">
      <div className="transactions-header">
        <h3>🪙 Token Transactions</h3>
        <div className="transaction-status">
          {monitoredTokens > 0 ? (
            <>
              {isListening && (
                <span className="status-indicator listening">
                  🟢 Monitoring {monitoredTokens} token{monitoredTokens > 1 ? 's' : ''}
                </span>
              )}
              {error && (
                <span className="status-indicator error">
                  ❌ {error}
                </span>
              )}
            </>
          ) : (
            <span className="status-indicator inactive">
              ⚫ No tokens configured
            </span>
          )}
          <button 
            onClick={refetch} 
            disabled={isLoading || monitoredTokens === 0}
            className="refresh-button"
          >
            {isLoading ? '🔄' : '↻'} Refresh
          </button>
        </div>
      </div>

      {monitoredTokens === 0 ? (
        <div className="no-tokens">
          <p>No tokens configured for monitoring</p>
          <small>Add ERC20 tokens in the Token Manager to see their transactions here</small>
        </div>
      ) : isLoading && transactions.length === 0 ? (
        <div className="loading">
          <p>🔍 Loading token transactions...</p>
        </div>
      ) : transactions.length === 0 ? (
        <div className="no-transactions">
          <p>No token transactions found</p>
          <small>Send tokens to your connected address to see transactions here</small>
        </div>
      ) : (
        <div className="transactions-list">
          {transactions.map((tx: ERC20Transaction) => (
            <div key={`${tx.hash}-${tx.tokenAddress}`} className="transaction-item">
              <div className="transaction-main">
                <div className="transaction-amount">
                  <div className="token-info">
                    <span className="token-icon">{getTokenIcon(tx.tokenSymbol)}</span>
                    <div className="amount-details">
                      <span className="amount">+{tx.formattedValue}</span>
                      <span className="token-symbol">{tx.tokenSymbol}</span>
                    </div>
                  </div>
                  <span className="network">{tx.networkName}</span>
                </div>
                <div className="transaction-details">
                  <div className="detail-row">
                    <span className="label">Token:</span>
                    <span className="token-name">{tx.tokenName}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">From:</span>
                    <span className="address">{formatAddress(tx.from)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">To:</span>
                    <span className="address">{formatAddress(tx.to)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Time:</span>
                    <span className="time">{formatTimestamp(tx.timestamp)}</span>
                  </div>
                </div>
              </div>
              <div className="transaction-actions">
                <a
                  href={getExplorerUrl(tx.hash, tx.chainId)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="view-link"
                >
                  View on Explorer →
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {transactions.length > 0 && (
        <div className="transactions-footer">
          <p>Showing latest {transactions.length} transactions</p>
          {isListening && (
            <p className="live-indicator">
              🔴 Live monitoring active - new transactions will appear automatically
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default TokenTransactions;
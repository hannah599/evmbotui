import React from 'react';
import { useUSDTTransactions, USDTTransaction } from '../hooks/useUSDTTransactions';
import './USDTTransactions.css';

interface USDTTransactionsProps {
  account: string | null;
  provider: any;
  chainId: number | null;
  isConnected: boolean;
}

const USDTTransactions: React.FC<USDTTransactionsProps> = ({
  account,
  provider,
  chainId,
  isConnected,
}) => {
  const { transactions, isLoading, error, isListening, refetch } = useUSDTTransactions({
    account,
    provider,
    chainId,
    isConnected,
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

  if (!isConnected) {
    return (
      <div className="usdt-transactions">
        <div className="transactions-header">
          <h3>💰 USDT Transactions</h3>
          <p className="connect-message">Connect your wallet to monitor USDT transactions</p>
        </div>
      </div>
    );
  }

  return (
    <div className="usdt-transactions">
      <div className="transactions-header">
        <h3>💰 USDT Transactions</h3>
        <div className="transaction-status">
          {isListening && (
            <span className="status-indicator listening">
              🟢 Monitoring incoming USDT
            </span>
          )}
          {error && (
            <span className="status-indicator error">
              ❌ {error}
            </span>
          )}
          <button 
            onClick={refetch} 
            disabled={isLoading}
            className="refresh-button"
          >
            {isLoading ? '🔄' : '↻'} Refresh
          </button>
        </div>
      </div>

      {isLoading && transactions.length === 0 ? (
        <div className="loading">
          <p>🔍 Loading USDT transactions...</p>
        </div>
      ) : transactions.length === 0 ? (
        <div className="no-transactions">
          <p>No USDT transactions found</p>
          <small>Send USDT to your connected address to see transactions here</small>
        </div>
      ) : (
        <div className="transactions-list">
          {transactions.map((tx: USDTTransaction) => (
            <div key={`${tx.hash}-${tx.chainId}`} className="transaction-item">
              <div className="transaction-main">
                <div className="transaction-amount">
                  <span className="amount">+{tx.formattedValue} USDT</span>
                  <span className="network">{tx.networkName}</span>
                </div>
                <div className="transaction-details">
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

export default USDTTransactions;
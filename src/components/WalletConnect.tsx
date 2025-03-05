import React from 'react';
import { useWallet } from '../hooks/useWallet';
import './WalletConnect.css';

const WalletConnect: React.FC = () => {
  const {
    isConnected,
    account,
    balance,
    chainId,
    isLoading,
    error,
    connectWallet,
    disconnectWallet,
    switchNetwork,
  } = useWallet();

  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const getNetworkName = (chainId: number) => {
    const networks: { [key: number]: string } = {
      1: 'Ethereum Mainnet',
      11155111: 'Sepolia Testnet',
      137: 'Polygon Mainnet',
      80001: 'Polygon Mumbai',
      56: 'BSC Mainnet',
      97: 'BSC Testnet',
    };
    return networks[chainId] || `Chain ID: ${chainId}`;
  };

  const handleNetworkSwitch = async (targetChainId: string) => {
    await switchNetwork(targetChainId);
  };

  if (error) {
    return (
      <div className="wallet-connect error">
        <p className="error-message">❌ {error}</p>
        <button onClick={connectWallet} disabled={isLoading}>
          Try Again
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="wallet-connect loading">
        <p>🔄 Connecting...</p>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="wallet-connect disconnected">
        <h3>Connect Your Wallet</h3>
        <p>Connect your EVM wallet to start using EVMBot</p>
        <button onClick={connectWallet} className="connect-button">
          Connect Wallet
        </button>
      </div>
    );
  }

  return (
    <div className="wallet-connect connected">
      <div className="wallet-info">
        <div className="wallet-header">
          <h3>🟢 Wallet Connected</h3>
          <button onClick={disconnectWallet} className="disconnect-button">
            Disconnect
          </button>
        </div>
        
        <div className="wallet-details">
          <div className="detail-row">
            <span className="label">Address:</span>
            <span className="value">{account && formatAddress(account)}</span>
          </div>
          
          <div className="detail-row">
            <span className="label">Balance:</span>
            <span className="value">{balance ? `${parseFloat(balance).toFixed(4)} ETH` : '0 ETH'}</span>
          </div>
          
          <div className="detail-row">
            <span className="label">Network:</span>
            <span className="value">{chainId && getNetworkName(chainId)}</span>
          </div>
        </div>

        <div className="network-switcher">
          <p>Switch Network:</p>
          <div className="network-buttons">
            <button 
              onClick={() => handleNetworkSwitch('0x1')}
              className={chainId === 1 ? 'active' : ''}
            >
              Ethereum
            </button>
            <button 
              onClick={() => handleNetworkSwitch('0xaa36a7')}
              className={chainId === 11155111 ? 'active' : ''}
            >
              Sepolia
            </button>
            <button 
              onClick={() => handleNetworkSwitch('0x89')}
              className={chainId === 137 ? 'active' : ''}
            >
              Polygon
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletConnect;
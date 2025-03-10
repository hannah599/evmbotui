import React from 'react'
import WalletConnect from './components/WalletConnect'
import TokenManager from './components/TokenManager'
import TokenTransactions from './components/TokenTransactions'
import { useWallet } from './hooks/useWallet'
import { useTokenManager } from './hooks/useTokenManager'
import './App.css'

function App() {
  const { account, provider, chainId, isConnected } = useWallet();
  const { activeTokens } = useTokenManager(provider, chainId);

  return (
    <>
      <div className="app">
        <header className="app-header">
          <h1>🤖 EVMBot</h1>
          <p>Your Ethereum Virtual Machine Assistant</p>
        </header>
        
        <main className="app-main">
          <WalletConnect />
          
          <TokenManager 
            provider={provider}
            chainId={chainId}
            isConnected={isConnected}
          />
          
          <TokenTransactions 
            account={account}
            provider={provider}
            chainId={chainId}
            isConnected={isConnected}
            activeTokens={activeTokens}
          />
          
          <div className="features-section">
            <h2>Features</h2>
            <div className="features-grid">
              <div className="feature-card">
                <h3>💰 Wallet Integration</h3>
                <p>Connect your MetaMask or other EVM-compatible wallets</p>
              </div>
              <div className="feature-card">
                <h3>🪙 Custom Token Monitoring</h3>
                <p>Add and monitor any ERC20 token transactions</p>
              </div>
              <div className="feature-card">
                <h3>🔗 Multi-Chain Support</h3>
                <p>Support for Ethereum, Polygon, BSC and other EVM chains</p>
              </div>
              <div className="feature-card">
                <h3>🔔 Live Notifications</h3>
                <p>Get instant notifications when tokens are received</p>
              </div>
              <div className="feature-card">
                <h3>🛠️ Token Management</h3>
                <p>Add, remove and configure ERC20 tokens to monitor</p>
              </div>
              <div className="feature-card">
                <h3>📊 Transaction History</h3>
                <p>View detailed history of all token transfers</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  )
}

export default App
import React from 'react'
import WalletConnect from './components/WalletConnect'
import USDTTransactions from './components/USDTTransactions'
import { useWallet } from './hooks/useWallet'
import './App.css'

function App() {
  const { account, provider, chainId, isConnected } = useWallet();

  return (
    <>
      <div className="app">
        <header className="app-header">
          <h1>🤖 EVMBot</h1>
          <p>Your Ethereum Virtual Machine Assistant</p>
        </header>
        
        <main className="app-main">
          <WalletConnect />
          
          <USDTTransactions 
            account={account}
            provider={provider}
            chainId={chainId}
            isConnected={isConnected}
          />
          
          <div className="features-section">
            <h2>Features</h2>
            <div className="features-grid">
              <div className="feature-card">
                <h3>💰 Wallet Integration</h3>
                <p>Connect your MetaMask or other EVM-compatible wallets</p>
              </div>
              <div className="feature-card">
                <h3>📨 USDT Monitoring</h3>
                <p>Real-time monitoring of incoming USDT transactions</p>
              </div>
              <div className="feature-card">
                <h3>🔗 Multi-Chain Support</h3>
                <p>Support for Ethereum, Polygon, BSC and other EVM chains</p>
              </div>
              <div className="feature-card">
                <h3>🔔 Live Notifications</h3>
                <p>Get instant notifications when USDT is received</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  )
}

export default App
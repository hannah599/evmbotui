import React from 'react'
import WalletConnect from './components/WalletConnect'
import './App.css'

function App() {
  return (
    <>
      <div className="app">
        <header className="app-header">
          <h1>🤖 EVMBot</h1>
          <p>Your Ethereum Virtual Machine Assistant</p>
        </header>
        
        <main className="app-main">
          <WalletConnect />
          
          <div className="features-section">
            <h2>Features</h2>
            <div className="features-grid">
              <div className="feature-card">
                <h3>💰 Wallet Integration</h3>
                <p>Connect your MetaMask or other EVM-compatible wallets</p>
              </div>
              <div className="feature-card">
                <h3>🔗 Multi-Chain Support</h3>
                <p>Support for Ethereum, Polygon, BSC and other EVM chains</p>
              </div>
              <div className="feature-card">
                <h3>📊 Portfolio Tracking</h3>
                <p>Track your tokens and transaction history</p>
              </div>
              <div className="feature-card">
                <h3>🔄 DeFi Integration</h3>
                <p>Interact with decentralized finance protocols</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  )
}

export default App
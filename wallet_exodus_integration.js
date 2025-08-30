/*
 * Wallet integration with fallback to WalletConnect for Exodus (desktop/mobile) and other wallets
 * Uses ethers.js and @walletconnect/web3-provider. The code first tries to use window.ethereum
 * (MetaMask/Brave/Exodus extension). If unavailable, it falls back to WalletConnect which presents
 * a QR code for connecting mobile wallets (e.g., Exodus mobile app).
 * Replace RPC_URL with a valid Ethereum RPC endpoint (e.g. Infura or Ankr).
 */

const GAME_ADDRESS = '0x8342904bdc6b023C7dC0213556b994428aa17fb9';
const RPC_URL = 'https://rpc.ankr.com/eth'; // Replace with your preferred ETH RPC endpoint

let provider;
let signer;
let userAccount;

async function connectCryptoWallet() {
  // If the browser has an injected provider (MetaMask, Brave, Exodus extension), use it
  if (window.ethereum) {
    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      provider = new ethers.providers.Web3Provider(window.ethereum);
      signer = provider.getSigner();
      userAccount = await signer.getAddress();
      updateWalletDisplay();
      return;
    } catch (err) {
      console.error('Injected provider connection failed:', err);
      // fallback to walletconnect
    }
  }
  // Fallback: use WalletConnect for mobile/desktop wallets like Exodus
  try {
    const wcProvider = new WalletConnectProvider.default({
      rpc: { 1: RPC_URL }
    });
    // Open QR modal and connect
    await wcProvider.enable();
    provider = new ethers.providers.Web3Provider(wcProvider);
    signer = provider.getSigner();
    const accounts = await provider.listAccounts();
    if (accounts.length > 0) {
      userAccount = accounts[0];
      updateWalletDisplay();
    }
    // Listen for session updates or disconnects
    wcProvider.on('disconnect', (code, reason) => {
      console.log('WalletConnect disconnected:', code, reason);
      userAccount = undefined;
      updateWalletDisplay();
    });
  } catch (err) {
    console.error('WalletConnect connection failed:', err);
  }
}

function updateWalletDisplay() {
  const addrEl = document.getElementById('wallet-address');
  const balEl = document.getElementById('token-balance');
  if (!userAccount) {
    if (addrEl) addrEl.textContent = '';
    if (balEl) balEl.textContent = '';
    return;
  }
  // Short address
  if (addrEl) addrEl.textContent = `Wallet: ${userAccount.substring(0,6)}...${userAccount.substring(userAccount.length-4)}`;
  updateEthBalance();
}

async function updateEthBalance() {
  if (!provider || !userAccount) return;
  try {
    const balWei = await provider.getBalance(userAccount);
    const balEth = ethers.utils.formatEther(balWei);
    const balEl = document.getElementById('token-balance');
    if (balEl) balEl.textContent = `ETH Balance: ${parseFloat(balEth).toFixed(4)} ETH`;
  } catch (err) {
    console.error('Failed to get ETH balance:', err);
  }
}

async function spendEth(amountEth) {
  if (!signer || !userAccount) {
    alert('Please connect your wallet first.');
    return;
  }
  try {
    const tx = await signer.sendTransaction({
      to: GAME_ADDRESS,
      value: ethers.utils.parseEther(amountEth.toString())
    });
    console.log('ETH payment tx sent:', tx.hash);
    await tx.wait();
    console.log('ETH payment tx confirmed');
    await updateEthBalance();
  } catch (err) {
    console.error('ETH payment failed:', err);
  }
}

// Helper: attach this function to your Connect Wallet button
// connectWalletBtn.addEventListener('click', connectCryptoWallet);

/* Wallet integration for using native Ethereum (ETH) as the in‑game currency.
   Requires ethers.js and MetaMask. No ERC‑20 token is used; instead, ETH is sent directly.
   Replace GAME_ADDRESS with the address that will receive payments for hints, items, etc.
*/

const GAME_ADDRESS = '0x8342904bdc6b023C7dC0213556b994428aa17fb9'; // Address that will receive ETH payments

let provider;
let signer;
let userAccount;

async function connectCryptoWallet() {
  if (!window.ethereum) {
    alert('MetaMask not detected. Please install MetaMask and try again.');
    return;
  }
  try {
    // Request account access
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    provider = new ethers.providers.Web3Provider(window.ethereum);
    signer = provider.getSigner();
    userAccount = await signer.getAddress();
    // Display abbreviated address
    const walletEl = document.getElementById('wallet-address');
    if (walletEl) walletEl.textContent = `Wallet: ${userAccount.substring(0,6)}...${userAccount.substring(userAccount.length-4)}`;
    await updateEthBalance();
  } catch (err) {
    console.error('Wallet connection failed:', err);
  }
}

async function updateEthBalance() {
  if (!provider || !userAccount) return;
  try {
    const balanceWei = await provider.getBalance(userAccount);
    const balanceEth = ethers.utils.formatEther(balanceWei);
    const balEl = document.getElementById('token-balance');
    if (balEl) balEl.textContent = `ETH Balance: ${parseFloat(balanceEth).toFixed(4)} ETH`;
  } catch (err) {
    console.error('Failed to fetch ETH balance:', err);
  }
}

// Send ETH to the game address. Amount is in Ether (not Wei). Will open MetaMask confirmation.
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
    console.log('Transaction sent:', tx.hash);
    await tx.wait();
    console.log('Transaction confirmed');
    await updateEthBalance();
  } catch (err) {
    console.error('Failed to send ETH:', err);
  }
}

// Example usage: attach these functions to your game controls
// connectWalletButton.addEventListener('click', connectCryptoWallet);
// hintButton.addEventListener('click', () => spendEth(0.001));

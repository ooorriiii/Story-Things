/* Wallet integration for using native Ethereum (ETH) as the in-game currency.
 * Requires ethers.js and MetaMask or another injected provider. No ERC-20 token is used;
 * ETH is sent directly to the address defined as GAME_ADDRESS.
 */
if (!window.GAME_ADDRESS) {
  window.GAME_ADDRESS = '0x8342904bdcb0b023c7dc0213556b994428aa17fb9';
}

let provider;
let signer;
let userAccount;

/**
 * Connect to the user's injected Ethereum wallet (e.g. MetaMask).
 * Returns an object with provider, signer, address and balance in ETH.
 * If no wallet is installed, returns undefined.
 */
async function connectCryptoWallet() {
  if (!window.ethereum) {
    alert('MetaMask not detected. Please install MetaMask and try again.');
    return undefined;
  }
  try {
    provider = new ethers.providers.Web3Provider(window.ethereum, 'any');
    // Request account access
    await provider.send('eth_requestAccounts', []);
    signer = provider.getSigner();
    userAccount = await signer.getAddress();
    // Fetch balance in ETH
    const balanceWei = await provider.getBalance(userAccount);
    const balanceEth = ethers.utils.formatEther(balanceWei);
    // Update UI if elements exist
    const walletEl = document.getElementById('wallet-address');
    if (walletEl) {
      walletEl.textContent =
        'Wallet: ' +
        userAccount.substring(0, 6) +
        '...' +
        userAccount.substring(userAccount.length - 4);
    }
    const balanceEl = document.getElementById('wallet-balance');
    if (balanceEl) {
      balanceEl.textContent = 'Balance: ' + parseFloat(balanceEth).toFixed(4) + ' ETH';
    }
    return { provider, signer, address: userAccount, balanceEth };
  } catch (err) {
    console.error('Wallet connection failed:', err);
    throw err;
  }
}

/**
 * Update the displayed ETH balance if the wallet is connected and UI element exists.
 */
async function updateEthBalance() {
  if (!provider || !userAccount) return;
  try {
    const balanceWei = await provider.getBalance(userAccount);
    const balanceEth = ethers.utils.formatEther(balanceWei);
    const balanceEl = document.getElementById('wallet-balance');
    if (balanceEl) {
      balanceEl.textContent = 'Balance: ' + parseFloat(balanceEth).toFixed(4) + ' ETH';
    }
  } catch (err) {
    console.error('Failed to update ETH balance:', err);
  }
}

/**
 * Send ETH from the connected wallet to the game's address.
 * amountEth should be a number or string convertible to a BigNumber.
 * Returns the transaction hash upon success.
 */
async function spendEth(amountEth) {
  if (!signer) {
    throw new Error('Wallet not connected');
  }
  const tx = await signer.sendTransaction({
    to: GAME_ADDRESS,
    value: ethers.utils.parseEther(String(amountEth)),
  });
  await tx.wait();
  // Update balance after sending
  await updateEthBalance();
  return tx.hash;
}

// Expose functions globally so other scripts (e.g. game logic) can call them
window.connectCryptoWallet = connectCryptoWallet;
window.spendEth = spendEth;
window.updateEthBalance = updateEthBalance;

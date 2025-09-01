/* Wallet integration for using native Ethereum (ETH) as the in‑game currency.
 * Requires ethers.js and MetaMask or another injected provider. No ERC‑20 token is used;
 * ETH is sent directly to the address defined as GAME_ADDRESS.
 */
if (!window.GAME_ADDRESS) {
  window.GAME_ADDRESS = '0x8342904bdcb0b823c7dc0213556b994428aa17fb9';
}

let ethProvider;
let ethSigner;
let ethUserAccount;

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
    // Create a new provider and request account access
    ethProvider = new ethers.providers.Web3Provider(window.ethereum, 'any');
    await ethProvider.send('eth_requestAccounts', []);
    ethSigner = ethProvider.getSigner();
    ethUserAccount = await ethSigner.getAddress();

    // Fetch balance in ETH
    const balanceWei = await ethProvider.getBalance(ethUserAccount);
    const balanceEth = ethers.utils.formatEther(balanceWei);

    // Update UI if elements exist
    const walletEl = document.getElementById('wallet-address');
    if (walletEl) {
      walletEl.textContent = 'Wallet: ' + ethUserAccount;
    }
    const balanceEl = document.getElementById('wallet-balance');
    if (balanceEl) {
      balanceEl.textContent = 'Balance: ' + parseFloat(balanceEth).toFixed(4) + ' ETH';
    }
    return { provider: ethProvider, signer: ethSigner, address: ethUserAccount, balanceEth };
  } catch (err) {
    console.error('Wallet connection error', err);
    alert('Failed to connect wallet: ' + err.message);
    return undefined;
  }
}

window.connectCryptoWallet = connectCryptoWallet;

/**
 * Send ETH directly to the game address.
 * amountEth should be a string or number convertible to ether.
 */
window.spendEth = async function spendEth(amountEth) {
  if (!ethSigner) throw new Error('Wallet not connected');
  const tx = await ethSigner.sendTransaction({
    to: window.GAME_ADDRESS,
    value: ethers.utils.parseEther(String(amountEth)),
  });
  await tx.wait();
  return tx.hash;
};

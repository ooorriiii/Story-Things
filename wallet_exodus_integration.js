/*
  Wallet integration supporting MetaMask/Exodus Browser Extension AND Exodus mobile via WalletConnect.
  Uses ethers.js and @walletconnect/ethereum-provider. You need an Infura project ID (or other RPC) for WalletConnect.
  Replace INFURA_PROJECT_ID and GAME_ADDRESS with your values.
*/

const INFURA_PROJECT_ID = 'YOUR_INFURA_PROJECT_ID';
const GAME_ADDRESS = '0x8342904bdc6b023C7dC0213556b994428aa17fb9';

let provider;
let signer;
let userAccount;

async function connectCryptoWallet() {
  try {
    // Case 1: browser extension provides window.ethereum (MetaMask, Exodus extension)
    if (window.ethereum) {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      provider = new ethers.providers.Web3Provider(window.ethereum);
      signer = provider.getSigner();
      userAccount = await signer.getAddress();
      updateAddressDisplay();
      await updateEthBalance();
      return;
    }
    // Case 2: fallback to WalletConnect for Exodus mobile/desktop
    const walletConnectProvider = new window.WalletConnectEthereumProvider({
      projectId: INFURA_PROJECT_ID,
      showQrModal: true,
      chains: [1], // Ethereum mainnet; change if using testnet
      methods: ['eth_sendTransaction','eth_signTransaction','personal_sign','eth_sign','eth_signTypedData']
    });
    await walletConnectProvider.enable();
    provider = new ethers.providers.Web3Provider(walletConnectProvider);
    signer = provider.getSigner();
    userAccount = await signer.getAddress();
    updateAddressDisplay();
    await updateEthBalance();
  } catch (err) {
    console.error('Failed to connect wallet:', err);
    alert('Could not connect to wallet.');
  }
}

function updateAddressDisplay() {
  const walletEl = document.getElementById('wallet-address');
  if (walletEl && userAccount) {
    walletEl.textContent = `Wallet: ${userAccount.substring(0,6)}...${userAccount.substring(userAccount.length-4)}`;
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
    console.error('Failed to get ETH balance:', err);
  }
}

// Spend ETH by sending to the game's treasury address. Requires user confirmation.
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

// Attach this function to your connect wallet button in script.js:
// connectWalletBtn.addEventListener('click', connectCryptoWallet);

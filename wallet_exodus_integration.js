/* Universal wallet integration supporting MetaMask, Exodus Extension and Exodus Mobile/Desktop via WalletConnect.
   Requires ethers.js and @walletconnect/web3-provider (via CDN). If window.ethereum is available, it uses the injected provider. Otherwise it falls back to WalletConnect.
   Replace GAME_ADDRESS with your recipient address.
*/

const GAME_ADDRESS = '0x8342904bdc6b023C7dC0213556b994428aa17fb9';

let provider;
let signer;
let userAccount;

async function connectUniversalWallet() {
  if (window.ethereum) {
    // Use injected provider (MetaMask, Exodus Extension, Brave etc.)
    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      provider = new ethers.providers.Web3Provider(window.ethereum);
      signer = provider.getSigner();
      userAccount = await signer.getAddress();
      const walletEl = document.getElementById('wallet-address');
      if (walletEl) walletEl.textContent = `Wallet: ${userAccount.substring(0, 6)}...${userAccount.substring(userAccount.length - 4)}`;
      await updateEthBalance();
      return;
    } catch (err) {
      console.error('Error connecting via injected provider:', err);
      return;
    }
  }
  // Fallback to WalletConnect (for Exodus mobile/desktop)
  if (typeof WalletConnectProvider === 'undefined') {
    alert('WalletConnect provider not found. Please include @walletconnect/web3-provider script.');
    return;
  }
  try {
    const wcProvider = new WalletConnectProvider.default({
      rpc: {
        1: 'https://mainnet.infura.io/v3/your_infura_project_id'
      },
      qrcode: true
    });
    await wcProvider.enable();
    provider = new ethers.providers.Web3Provider(wcProvider);
    signer = provider.getSigner();
    userAccount = await signer.getAddress();
    const walletEl = document.getElementById('wallet-address');
    if (walletEl) walletEl.textContent = `Wallet: ${userAccount.substring(0, 6)}...${userAccount.substring(userAccount.length - 4)}`;
    await updateEthBalance();
    wcProvider.on('disconnect', () => {
      console.log('WalletConnect disconnected');
      provider = null;
      signer = null;
      userAccount = null;
    });
  } catch (err) {
    console.error('Error connecting via WalletConnect:', err);
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

async function spendEth(amountEth) {
  if (!signer || !userAccount) {
    alert('Please connect your wallet first.');
    return;
  }
  try {
    const tx = await signer.sendTransaction({ to: GAME_ADDRESS, value: ethers.utils.parseEther(amountEth.toString()) });
    console.log('Transaction sent:', tx.hash);
    await tx.wait();
    console.log('Transaction confirmed');
    await updateEthBalance();
  } catch (err) {
    console.error('Failed to send ETH:', err);
  }
}

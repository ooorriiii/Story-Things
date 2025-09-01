/* wallet_wc_v2.js – WalletConnect V2 + MetaMask/Exodus Extension
 *
 * This version includes a helper to dynamically load the WalletConnect V2 UMD
 * bundle if it is not already present on the page.  Without this, calling
 * connectCryptoWallet() would throw "WalletConnect v2 UMD not loaded" when
 * the provider script isn't included manually.
 */

const GAME_ADDRESS = '0x8342904bdc6b023C7dC0213556b994428aa17fb9';
const WC_PROJECT_ID = 'b80a9c61167c5f3d1f625bf26ede6c6b';
const CHAINS = [1];

let provider;
let signer;
let userAddress;

function checksum(addr) {
  return ethers.utils.getAddress(addr);
}

function isMobile() {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

// Dynamically load the WalletConnect Ethereum provider if it's not already
// available on window.  Returns a promise that resolves when loaded.
async function ensureWalletConnectLoaded() {
  if (window.WalletConnectEthereumProvider) {
    return;
  }
  await new Promise((resolve, reject) => {
    const script = document.createElement('script');
    // Use a versioned CDN path for deterministic behaviour.  If you update
    // @walletconnect/ethereum-provider version, update the URL accordingly.
    script.src =
      'https://cdn.jsdelivr.net/npm/@walletconnect/ethereum-provider@2.21.8/dist/index.umd.min.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load WalletConnect UMD'));
    document.head.appendChild(script);
  });
}

async function connectInjected() {
  if (!window.ethereum) return null;
  const web3 = new ethers.providers.Web3Provider(window.ethereum, 'any');
  await web3.send('eth_requestAccounts', []);
  const s = web3.getSigner();
  const addr = checksum(await s.getAddress());
  const bal = ethers.utils.formatEther(await web3.getBalance(addr));
  return { provider: web3, signer: s, address: addr, balanceEth: bal };
}

async function connectWalletConnectV2() {
  // Ensure the provider library is loaded before using it.
  await ensureWalletConnectLoaded();
  const WCEProvider = window.WalletConnectEthereumProvider;
  if (!WCEProvider) throw new Error('WalletConnect provider script failed to load');
  const wc = await WCEProvider.init({
    projectId: WC_PROJECT_ID,
    chains: CHAINS,
    showQrModal: !isMobile(),
    metadata: {
      name: 'Crypto Hidden Object Game',
      description: 'Hidden-objects game with ETH wallet support',
      url: location.origin,
      icons: [],
    },
  });
  wc.on('display_uri', (uri) => {
    if (isMobile()) {
      window.location.href = `exodus://wc?uri=${encodeURIComponent(uri)}`;
    }
  });
  await wc.connect();
  const web3 = new ethers.providers.Web3Provider(wc, 'any');
  const s = web3.getSigner();
  const addr = checksum(await s.getAddress());
  const bal = ethers.utils.formatEther(await web3.getBalance(addr));
  return { provider: web3, signer: s, address: addr, balanceEth: bal };
}

window.connectCryptoWallet = async function connectCryptoWallet() {
  // Try injected provider first (MetaMask/Exodus extension)
  const inj = await connectInjected();
  if (inj) {
    provider = inj.provider;
    signer = inj.signer;
    userAddress = inj.address;
    return inj;
  }
  // Fall back to WalletConnect V2
  const wc = await connectWalletConnectV2();
  provider = wc.provider;
  signer = wc.signer;
  userAddress = wc.address;
  return wc;
};

window.spendEth = async function spendEth(amountEth) {
  if (!signer) throw new Error('Wallet not connected');
  const tx = await signer.sendTransaction({
    to: GAME_ADDRESS,
    value: ethers.utils.parseEther(String(amountEth)),
  });
  await tx.wait();
  return tx.hash;
};

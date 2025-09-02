/* wallet_wc_v2.js – WalletConnect V2 + MetaMask/Exodus Extension
 *
 * This version includes a helper to dynamically load the WalletConnect V2 UMD
 * bundle if it is not already present on the page.  Without this, calling
 * connectCryptoWallet() would throw "WalletConnect v2 UMD not loaded" when
 * the provider script isn't included manually.
 */

// הגדר את מזהי WalletConnect כמשתנים גלובליים רק אם הם לא קיימים
if (!window.GAME_ADDRESS) {
  window.GAME_ADDRESS = '0x8342904bdc6b023C7dC0213556b994428aa17fb9';
}
if (!window.WC_PROJECT_ID) {
  window.WC_PROJECT_ID = 'b80a9c61167c5f3d1f625bf26ede6c6b';
}
if (!window.CHAINS) {
  window.CHAINS = [1];
}

// הכרז משתנים ייחודיים כדי לא להתנגש בקבצים אחרים
let wcProvider;
let wcSigner;
let wcUserAddress;

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
    projectId: window.WC_PROJECT_ID,
    chains: window.CHAINS,
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
    wcProvider = inj.provider;
    wcSigner = inj.signer;
    wcUserAddress = inj.address;
    return inj;
  }
  // Fall back to WalletConnect V2
  const wc = await connectWalletConnectV2();
  wcProvider = wc.provider;
  wcSigner = wc.signer;
  wcUserAddress = wc.address;
  return wc;
};

window.spendEth = async function spendEth(amountEth) {
  if (!wcSigner) throw new Error('Wallet not connected');
  const tx = await wcSigner.sendTransaction({
    to: window.GAME_ADDRESS,
    value: ethers.utils.parseEther(String(amountEth)),
  });
  await tx.wait();
  return tx.hash;
};

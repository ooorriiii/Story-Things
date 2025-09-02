/* wallet_wc_v2.js – WalletConnect V2 + MetaMask/Exodus Extension */
if (!window.WC_PROJECT_ID) window.WC_PROJECT_ID = 'b80a9c61167c5f3d1f625bf26ede6c6b';
if (!window.CHAINS) window.CHAINS = [1];
let wcProvider, wcSigner, wcUserAddress;

function isMobile() { return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent); }
async function ensureWalletConnectLoaded() {
  if (window.WalletConnectEthereumProvider) return;
  await new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@walletconnect/ethereum-provider@2.21.8/dist/index.umd.min.js';
    script.onload = resolve; script.onerror = () => reject(new Error('Failed to load WalletConnect UMD'));
    document.head.appendChild(script);
  });
}
async function connectInjected() {
  if (!window.ethereum) return null;
  const web3 = new ethers.providers.Web3Provider(window.ethereum, 'any');
  await web3.send('eth_requestAccounts', []);
  const signer = web3.getSigner();
  const address = await signer.getAddress();
  return { provider: web3, signer, address };
}
async function connectWalletConnectV2() {
  await ensureWalletConnectLoaded();
  const WCEProvider = window.WalletConnectEthereumProvider;
  if (!WCEProvider) throw new Error('WalletConnect provider script failed to load');
  const wc = await WCEProvider.init({
    projectId: window.WC_PROJECT_ID,
    chains: window.CHAINS,
    showQrModal: !isMobile(),
    metadata: { name: 'Crypto Hidden Object Game', description: 'Hidden-objects game with ETH wallet support', url: location.origin, icons: [] },
  });
  wc.on('display_uri', (uri) => {
    if (isMobile()) window.location.href = `exodus://wc?uri=${encodeURIComponent(uri)}`;
  });
  await wc.connect();
  const web3 = new ethers.providers.Web3Provider(wc, 'any');
  const signer = web3.getSigner();
  const address = await signer.getAddress();
  return { provider: web3, signer, address };
}
window.connectCryptoWallet = async function () {
  const inj = await connectInjected();
  if (inj) { wcProvider = inj.provider; wcSigner = inj.signer; wcUserAddress = inj.address; return inj; }
  const wc = await connectWalletConnectV2();
  wcProvider = wc.provider; wcSigner = wc.signer; wcUserAddress = wc.address; return wc;
};
window.spendEth = async function (amountEth) {
  if (!wcSigner) throw new Error('Wallet not connected');
  const tx = await wcSigner.sendTransaction({ to: window.GAME_ADDRESS, value: ethers.utils.parseEther(String(amountEth)) });
  await tx.wait();
  return tx.hash;
};

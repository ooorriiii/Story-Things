/* wallet_wc_v2.js – WalletConnect V2 + MetaMask/Exodus Extension.
   החלף את YOUR_WALLETCONNECT_V2_PROJECT_ID במזהה הפרויקט שקיבלת מ-WalletConnect Cloud.
*/
const GAME_ADDRESS   = '0x8342904bdc6b023C7dC0213556b994428aa17fb9';
const WC_PROJECT_ID  = 'b80a9c61167c5f3d1f625bf26ede6c6b';
const CHAINS         = [1]; // Mainnet

let provider, signer, userAddress;

function checksum(addr) {
  return ethers.utils.getAddress(addr);
}
function isMobile() {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

async function connectInjected() {
  if (!window.ethereum) return null;
  const web3 = new ethers.providers.Web3Provider(window.ethereum, 'any');
  await web3.send('eth_requestAccounts', []);
  const s = web3.getSigner();
  const addr = checksum(await s.getAddress());
  const bal  = ethers.utils.formatEther(await web3.getBalance(addr));
  return { provider: web3, signer: s, address: addr, balanceEth: bal };
}

async function connectWalletConnectV2() {
  const WCEProvider = window.WalletConnectEthereumProvider;
  if (!WCEProvider) throw new Error('WalletConnect v2 UMD not loaded');
  const wc = await WCEProvider.init({
    projectId: WC_PROJECT_ID,
    chains: CHAINS,
    showQrModal: !isMobile(),
    metadata: {
      name: 'Crypto Hidden Object Game',
      description: 'Hidden-objects game with ETH wallet support',
      url: location.origin,
      icons: []
    }
  });
  wc.on('display_uri', (uri) => {
    if (isMobile()) {
      // deep-link ל-Exodus במובייל
      window.location.href = `exodus://wc?uri=${encodeURIComponent(uri)}`;
    }
  });
  await wc.connect();
  const web3 = new ethers.providers.Web3Provider(wc, 'any');
  const s    = web3.getSigner();
  const addr = checksum(await s.getAddress());
  const bal  = ethers.utils.formatEther(await web3.getBalance(addr));
  return { provider: web3, signer: s, address: addr, balanceEth: bal };
}

window.connectCryptoWallet = async function connectCryptoWallet() {
  // injected קודם (MetaMask/Exodus Extension)
  const inj = await connectInjected();
  if (inj) {
    provider = inj.provider;
    signer   = inj.signer;
    userAddress = inj.address;
    return inj;
  }
  // אחרת WalletConnect v2
  const wc = await connectWalletConnectV2();
  provider = wc.provider;
  signer   = wc.signer;
  userAddress = wc.address;
  return wc;
};

window.spendEth = async function spendEth(amountEth) {
  if (!signer) throw new Error('Wallet not connected');
  const tx = await signer.sendTransaction({
    to: GAME_ADDRESS,
    value: ethers.utils.parseEther(String(amountEth))
  });
  await tx.wait();
  return tx.hash;
};

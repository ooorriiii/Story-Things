/* wallet_wc_v2.js – WalletConnect v2 + MetaMask/Exodus Extension
   Exodus Mobile יתחבר דרך v2; בדסקטופ עם תוסף – injected.
   חשוב: החלף את YOUR_WALLETCONNECT_V2_PROJECT_ID בפרויקט שלך.
*/
const GAME_ADDRESS   = '0x8342904bdc6b023C7dC0213556b994428aa17fb9';
const WC_PROJECT_ID  = 'YOUR_WALLETCONNECT_V2_PROJECT_ID'; // ← להחליף!
const CHAINS         = [1]; // Mainnet (לבדיקה: [11155111] Sepolia)

let provider, signer, userAddress;

function log(s){ try{document.getElementById('log').textContent=String(s)}catch{} console.log(s); }
function checksum(a){ return ethers.utils.getAddress(a); }
function isMobile(){ return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent); }

/** injected (MetaMask/Exodus Extension) */
async function connectInjected(){
  if(!window.ethereum) return null;
  const web3 = new ethers.providers.Web3Provider(window.ethereum,'any');
  await web3.send('eth_requestAccounts',[]);
  const s = web3.getSigner();
  const addr = checksum(await s.getAddress());
  const bal  = ethers.utils.formatEther(await web3.getBalance(addr));
  return { provider:web3, signer:s, address:addr, balanceEth:bal };
}

/** WalletConnect v2 (UMD) */
async function connectWCv2(){
  const WCEProvider = window.WalletConnectEthereumProvider;
  if(!WCEProvider){
    throw new Error('WalletConnect v2 UMD not loaded');
  }
  const wc = await WCEProvider.init({
    projectId: WC_PROJECT_ID,
    chains: CHAINS,
    showQrModal: !isMobile(),
    optionalMethods: ['eth_sendTransaction','personal_sign','eth_signTypedData','eth_sign'],
    metadata: {
      name: 'Crypto Hidden Object Game',
      description: 'Hidden-objects game with ETH wallet support',
      url: location.origin,
      icons: ['https://walletconnect.com/walletconnect-logo.png']
    }
  });

  wc.on('display_uri', (uri)=>{ log('[WC v2] display_uri'); if(isMobile()){ location.href = `exodus://wc?uri=${encodeURIComponent(uri)}`; }});
  wc.on('accountsChanged', (acc)=>console.log('[WC v2] accountsChanged', acc));
  wc.on('chainChanged',    (ch)=>console.log('[WC v2] chainChanged', ch));
  wc.on('disconnect',      (e)=>console.log('[WC v2] disconnect', e));

  await wc.connect();
  const web3 = new ethers.providers.Web3Provider(wc,'any');
  const s    = web3.getSigner();
  const addr = checksum(await s.getAddress());
  const bal  = ethers.utils.formatEther(await web3.getBalance(addr));

  return { provider:web3, signer:s, address:addr, balanceEth:bal };
}

/** API ציבורי למשחק */
window.connectCryptoWallet = async function connectCryptoWallet(){
  try{
    // קודם injected
    const inj = await connectInjected();
    if(inj){ ({provider,signer,userAddress}=inj); return inj; }

    // אחרת WC v2
    const wc = await connectWCv2();
    ({provider,signer,userAddress}=wc);
    return wc;
  }catch(e){
    log(e?.message||e);
    throw e;
  }
};

window.spendEth = async function spendEth(amountEth){
  if(!signer) throw new Error('Wallet not connected');
  const tx = await signer.sendTransaction({ to: GAME_ADDRESS, value: ethers.utils.parseEther(String(amountEth)) });
  await tx.wait();
  return tx.hash;
};

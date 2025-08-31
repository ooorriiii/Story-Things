/* wallet_wc_v2.js
   WalletConnect v2 + fallback ל-MetaMask/Exodus Extension (injected).
   חשוב: צריך projectId מ-https://cloud.walletconnect.com/ (בחינם).
*/

const GAME_ADDRESS = '0x8342904bdc6b023C7dC0213556b994428aa17fb9'; // יעד תשלומים (ETH)
const WC_PROJECT_ID = 'YOUR_WALLETCONNECT_V2_PROJECT_ID';            // ← החלף ב-projectId אמיתי
const CHAINS = [1]; // Mainnet. לבדיקה על Sepolia: [11155111]

let provider, signer, userAddress;

function checksum(addr){ return ethers.utils.getAddress(addr); }
function isMobile(){ return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent); }

/** injected (MetaMask / Exodus Extension) */
async function connectInjected(){
  if(!window.ethereum) return null;
  const web3 = new ethers.providers.Web3Provider(window.ethereum, 'any');
  await web3.send('eth_requestAccounts',[]);
  const s = web3.getSigner();
  const addr = checksum(await s.getAddress());
  const bal  = ethers.utils.formatEther(await web3.getBalance(addr));
  return { provider:web3, signer:s, address:addr, balanceEth:bal };
}

/** WalletConnect v2 (UMD) */
async function connectWalletConnectV2(){
  // הגלובל מה-UMD
  const WCEProvider = window.WalletConnectEthereumProvider
                      && window.WalletConnectEthereumProvider.default;
  if(!WCEProvider){
    throw new Error('WalletConnect v2 UMD not loaded');
  }
  const wc = await WCEProvider.init({
    projectId: WC_PROJECT_ID,
    chains: CHAINS,                 // רשתות מאושרות
    showQrModal: !isMobile(),       // בדסקטופ – QR; במובייל Exodus יפתח deep-link
    optionalMethods: [
      'eth_sendTransaction',
      'personal_sign',
      'eth_signTypedData',
      'eth_sign'
    ],
    metadata: {
      name: 'Crypto Hidden Object Game',
      description: 'Hidden-objects game with ETH wallet support',
      url: location.origin,
      icons: ['https://walletconnect.com/walletconnect-logo.png']
    }
  });

  await wc.connect();                              // מפעיל מודאל/דיפ-לינק
  const web3 = new ethers.providers.Web3Provider(wc, 'any');
  const s    = web3.getSigner();
  const addr = checksum(await s.getAddress());
  const bal  = ethers.utils.formatEther(await web3.getBalance(addr));

  // אופציונלי: האזנה להחלפת חשבון/רשת
  wc.on('accountsChanged', (acc)=>console.log('[WC v2] accountsChanged', acc));
  wc.on('chainChanged',    (ch)=>console.log('[WC v2] chainChanged', ch));
  wc.on('disconnect',      (e)=>console.log('[WC v2] disconnect', e));

  return { provider:web3, signer:s, address:addr, balanceEth:bal };
}

/** API ציבורי למשחק – הקריאה מכפתור Connect */
window.connectCryptoWallet = async function connectCryptoWallet(){
  // injected קודם
  const inj = await connectInjected();
  if(inj){ ({provider,signer,userAddress}=inj); return inj; }

  // אחרת WC v2
  const wc = await connectWalletConnectV2();
  ({provider,signer,userAddress}=wc);
  return wc;
};

/** שליחת ETH (למשל עבור רמז/קנייה בחנות) */
window.spendEth = async function spendEth(amountEth){
  if(!signer) throw new Error('Wallet not connected');
  const tx = await signer.sendTransaction({
    to: GAME_ADDRESS,
    value: ethers.utils.parseEther(String(amountEth))
  });
  await tx.wait();
  return tx.hash;
};

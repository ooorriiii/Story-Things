/* Exodus/WalletConnect + MetaMask integration (ETH only) */
const GAME_ADDRESS = '0x8342904bdc6b023C7dC0213556b994428aa17fb9'; // ארנק המשחק (יעד תשלומים)
let provider, signer, userAddress;

function checksum(addr){ return ethers.utils.getAddress(addr); }
function isMobile(){ return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent); }

/* חיבור injected (MetaMask/Exodus Extension) */
async function connectInjected(){
  if(!window.ethereum) return null;
  const web3p = new ethers.providers.Web3Provider(window.ethereum,'any');
  await web3p.send('eth_requestAccounts',[]);
  const s = web3p.getSigner();
  const addr = checksum(await s.getAddress());
  const balWei = await web3p.getBalance(addr);
  const balanceEth = ethers.utils.formatEther(balWei);
  return { provider:web3p, signer:s, address:addr, balanceEth };
}

/* חיבור WalletConnect (Exodus במובייל/דסקטופ) */
async function connectWC(){
  if(!(window.WalletConnectProvider && window.WalletConnectProvider.default))
    throw new Error('WalletConnect provider not loaded');
  const WCP = window.WalletConnectProvider.default;
  const wc = new WCP({ rpc:{1:'https://cloudflare-eth.com'}, qrcode:!isMobile() });

  wc.connector.on('display_uri',(err,payload)=>{
    if(err) return console.error(err);
    const uri = payload.params[0];
    if(isMobile()){
      const exodusLink = `exodus://wc?uri=${encodeURIComponent(uri)}`;
      window.location.href = exodusLink;
    }
  });

  await wc.enable();
  const web3p = new ethers.providers.Web3Provider(wc,'any');
  const s = web3p.getSigner();
  const addr = checksum(await s.getAddress());
  const balWei = await web3p.getBalance(addr);
  const balanceEth = ethers.utils.formatEther(balWei);
  return { provider:web3p, signer:s, address:addr, balanceEth };
}

/* API ציבורי שהמשחק קורא */
window.connectCryptoWallet = async function connectCryptoWallet(){
  const inj = await connectInjected();
  if(inj){ ({provider,signer,userAddress}=inj); return inj; }
  const wc = await connectWC();
  ({provider,signer,userAddress}=wc);
  return wc;
};

window.spendEth = async function spendEth(amountEth){
  if(!signer) throw new Error('Wallet not connected');
  const tx = await signer.sendTransaction({
    to: GAME_ADDRESS,
    value: ethers.utils.parseEther(String(amountEth))
  });
  await tx.wait();
  return tx.hash;
};

// Exodus/WalletConnect + MetaMask integration (ETH only)
export const GAME_ADDRESS = '0x8342904bdc6b023C7dC0213556b994428aa17fb9'; // יעד תשלומים
const EXPECTED_CHAIN_ID = '0x1'; // Mainnet. Sepolia: '0xaa36a7'

let provider, signer, userAddress;

function checksum(addr){ return ethers.utils.getAddress(addr); }

async function ensureChain(eth){
  try{
    const cur = await eth.request({ method:'eth_chainId' });
    if(cur !== EXPECTED_CHAIN_ID){
      await eth.request({ method:'wallet_switchEthereumChain', params:[{ chainId: EXPECTED_CHAIN_ID }] });
    }
  }catch(e){
    console.warn('Chain switch warning:', e?.message||e);
  }
}

export async function connectCryptoWallet(){
  // Injected provider (MetaMask/Exodus extension)
  if(window.ethereum){
    await ensureChain(window.ethereum);
    provider = new ethers.providers.Web3Provider(window.ethereum,'any');
    await provider.send('eth_requestAccounts',[]);
    signer = provider.getSigner();
    userAddress = checksum(await signer.getAddress());
    const balWei = await provider.getBalance(userAddress);
    const balanceEth = ethers.utils.formatEther(balWei);
    return { address:userAddress, balanceEth, gameAddress:checksum(GAME_ADDRESS) };
  }

  // WalletConnect fallback (Exodus mobile/desktop)
  if(window.WalletConnectProvider && window.WalletConnectProvider.default){
    const wc = new window.WalletConnectProvider.default({
      rpc:{ 1:'https://cloudflare-eth.com' }, qrcode:true
    });
    await wc.enable();
    provider = new ethers.providers.Web3Provider(wc,'any');
    signer = provider.getSigner();
    userAddress = checksum(await signer.getAddress());
    const balWei = await provider.getBalance(userAddress);
    const balanceEth = ethers.utils.formatEther(balWei);
    return { address:userAddress, balanceEth, gameAddress:checksum(GAME_ADDRESS) };
  }

  throw new Error('No wallet provider found. Install MetaMask/Exodus or use WalletConnect.');
}

export async function spendEth(amountEth){
  if(!signer) throw new Error('Wallet not connected');
  const tx = await signer.sendTransaction({
    to: GAME_ADDRESS,
    value: ethers.utils.parseEther(amountEth)
  });
  await tx.wait();
  return tx.hash;
}

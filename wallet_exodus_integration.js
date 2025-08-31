/* Exodus/WalletConnect integration for ETH */
const GAME_ADDRESS = '0x8342904bdc6b023C7dC0213556b994428aa17fb9';
let provider, signer, userAccount;

async function connectCryptoWallet(){
  // 1) Try injected provider (MetaMask/Exodus extension)
  if (window.ethereum) {
    provider = new ethers.providers.Web3Provider(window.ethereum, 'any');
    await provider.send('eth_requestAccounts', []);
    signer = provider.getSigner();
    userAccount = await signer.getAddress();
    const balWei = await provider.getBalance(userAccount);
    const balanceEth = ethers.utils.formatEther(balWei);
    return { address: userAccount, balanceEth };
  }

  // 2) Fallback: WalletConnect (for Exodus mobile/desktop)
  if (window.WalletConnectProvider && window.WalletConnectProvider.default){
    const wc = new window.WalletConnectProvider.default({
      rpc: { 1: 'https://cloudflare-eth.com' }, // Public RPC; replace with Infura/Alchemy for production
      qrcode: true
    });
    await wc.enable();
    provider = new ethers.providers.Web3Provider(wc, 'any');
    signer = provider.getSigner();
    userAccount = await signer.getAddress();
    const balWei = await provider.getBalance(userAccount);
    const balanceEth = ethers.utils.formatEther(balWei);
    return { address: userAccount, balanceEth };
  }

  throw new Error('No wallet provider found. Please install MetaMask/Exodus extension or use WalletConnect.');
}

// Optional: spend ETH (e.g., pay for hints)
// amountEth is a string like '0.001'
async function spendEth(amountEth){
  if (!signer) throw new Error('Wallet not connected');
  const tx = await signer.sendTransaction({
    to: GAME_ADDRESS,
    value: ethers.utils.parseEther(amountEth)
  });
  // Wait for confirmation (optional)
  await tx.wait();
  return tx.hash;
}

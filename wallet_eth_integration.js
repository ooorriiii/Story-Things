/* ETH-only wallet integration (MetaMask/Exodus extension) */
const GAME_ADDRESS = '0x8342904bdc6b023C7dC0213556b994428aa17fb9';
let provider, signer, userAccount;

async function connectCryptoWallet(){
  if (!window.ethereum) throw new Error('No injected wallet found');
  provider = new ethers.providers.Web3Provider(window.ethereum, 'any');
  await provider.send('eth_requestAccounts', []);
  signer = provider.getSigner();
  userAccount = await signer.getAddress();
  const balWei = await provider.getBalance(userAccount);
  const balanceEth = ethers.utils.formatEther(balWei);
  return { address: userAccount, balanceEth };
}

async function spendEth(amountEth){
  if (!signer) throw new Error('Wallet not connected');
  const tx = await signer.sendTransaction({ to: GAME_ADDRESS, value: ethers.utils.parseEther(amountEth) });
  await tx.wait();
  return tx.hash;
}

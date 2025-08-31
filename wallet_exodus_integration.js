/* Exodus/WalletConnect integration for ETH */
const GAME_ADDRESS = "0x8342904bdc6b023C7dC0213556b994428aa17fb9";
let provider, signer, userAccount;

async function connectCryptoWallet(){
  if(window.ethereum){
    provider=new ethers.providers.Web3Provider(window.ethereum,"any");
    await provider.send("eth_requestAccounts",[]);
    signer=provider.getSigner(); userAccount=await signer.getAddress();
    const balWei=await provider.getBalance(userAccount);
    const balanceEth=ethers.utils.formatEther(balWei);
    return {address:userAccount,balanceEth};
  }
  if(window.WalletConnectProvider&&window.WalletConnectProvider.default){
    const wc=new window.WalletConnectProvider.default({
      rpc:{1:"https://cloudflare-eth.com"},qrcode:true
    });
    await wc.enable();
    provider=new ethers.providers.Web3Provider(wc,"any");
    signer=provider.getSigner(); userAccount=await signer.getAddress();
    const balWei=await provider.getBalance(userAccount);
    const balanceEth=ethers.utils.formatEther(balWei);
    return {address:userAccount,balanceEth};
  }
  throw new Error("No wallet provider found");
}

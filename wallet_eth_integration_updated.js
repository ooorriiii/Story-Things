/* Wallet integration for using native Ethereum (ETH) as the in‑game currency. */
if (!window.GAME_ADDRESS) {
  window.GAME_ADDRESS = '0x8342904bdcb0b823c7dc0213556b994428aa17fb9';
}

let ethProvider, ethSigner, ethUserAccount;

async function connectCryptoWallet() {
  if (!window.ethereum) {
    alert('MetaMask not detected. Please install MetaMask and try again.');
    return undefined;
  }
  try {
    ethProvider = new ethers.providers.Web3Provider(window.ethereum, 'any');
    await ethProvider.send('eth_requestAccounts', []);
    ethSigner = ethProvider.getSigner();
    ethUserAccount = await ethSigner.getAddress();
    const balanceWei = await ethProvider.getBalance(ethUserAccount);
    const balanceEth = ethers.utils.formatEther(balanceWei);
    const walletEl = document.getElementById('wallet-address');
    if (walletEl) walletEl.textContent = 'Wallet: ' + ethUserAccount;
    const balanceEl = document.getElementById('wallet-balance');
    if (balanceEl) balanceEl.textContent = 'Balance: ' + parseFloat(balanceEth).toFixed(4) + ' ETH';
    return { provider: ethProvider, signer: ethSigner, address: ethUserAccount, balanceEth };
  } catch (err) {
    console.error(err);
    alert('Failed to connect wallet: ' + err.message);
    return undefined;
  }
}
window.connectCryptoWallet = connectCryptoWallet;

window.spendEth = async function spendEth(amountEth) {
  if (!ethSigner) throw new Error('Wallet not connected');
  const tx = await ethSigner.sendTransaction({
    to: window.GAME_ADDRESS,
    value: ethers.utils.parseEther(String(amountEth)),
  });
  await tx.wait();
  return tx.hash;
};

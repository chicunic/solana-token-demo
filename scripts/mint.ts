import { address } from '@solana/kit';
import { env, loadSigner, rpc } from '../src/config.js';
import { buildAndSendTransaction } from '../src/helpers.js';
import { createAndMintToken } from '../src/mint.js';

const payer = await loadSigner(env.fromWalletPrivateKey);
const toWalletAddress = address(env.toWalletPublicKey);

const result = await createAndMintToken({
  rpc,
  payer,
  toWalletAddress,
  sendTransaction: buildAndSendTransaction,
});

console.log('mint:', result.mintAddress);
console.log('fromTokenAccount:', result.fromAta);
console.log('toTokenAccount:', result.toAta);
console.log('mintTx:', `https://solscan.io/tx/${result.mintSignature}?cluster=devnet`);
console.log('transferTx:', `https://solscan.io/tx/${result.transferSignature}?cluster=devnet`);

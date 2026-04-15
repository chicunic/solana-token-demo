import { address } from '@solana/kit';
import { env, loadSigner, rpc } from '../src/config.js';
import { buildAndSendTransaction } from '../src/helpers.js';
import { transferSolAndToken } from '../src/transfer.js';

const payer = await loadSigner(env.fromWalletPrivateKey);
const toWalletAddress = address(env.toWalletPublicKey);
const mintAddress = address(env.tokenPublicKey);

const result = await transferSolAndToken({
  rpc,
  payer,
  toWalletAddress,
  mintAddress,
  solAmount: 100n,
  tokenAmount: 200n,
  memo: 'Just a memo',
  sendTransaction: buildAndSendTransaction,
});

console.log('fromTokenAccount:', result.fromAta);
console.log('toTokenAccount:', result.toAta);
console.log('tx:', `https://solscan.io/tx/${result.signature}?cluster=devnet`);
console.log('fromTokenBalance:', result.fromTokenBalance);
console.log('toTokenBalance:', result.toTokenBalance);

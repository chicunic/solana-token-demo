import { createMemoInstruction } from '@solana/spl-memo';
import {
  TOKEN_PROGRAM_ID,
  createBurnInstruction,
  getAccount,
  getOrCreateAssociatedTokenAccount,
} from '@solana/spl-token';
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  clusterApiUrl,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import 'dotenv/config';
import { decodeBase58 } from 'ethers';

const fromWalletPrivateHex = decodeBase58(process.env.FROM_WALLET_PRIVATE_KEY as string).toString(16);
const toWalletPrivateHex = decodeBase58(process.env.TO_WALLET_PRIVATE_KEY as string).toString(16);
const tokenPublicKey = process.env.TOKEN_PUBLIC_KEY as string;

/**
 * This function contains following operations:
 * 1. Transfer SOL from `fromWallet` to `toWallet`
 * 2. Burn token from `fromWallet`
 * 3. Add memo to the transaction
 */
(async function main() {
  // prepare wallets
  const fromWallet = Keypair.fromSecretKey(Uint8Array.from(Buffer.from(fromWalletPrivateHex, 'hex')));
  const toWallet = Keypair.fromSecretKey(Uint8Array.from(Buffer.from(toWalletPrivateHex, 'hex')));

  // prepare token accounts
  const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
  const mint = new PublicKey(tokenPublicKey);
  const fromTokenAccount = await getOrCreateAssociatedTokenAccount(connection, fromWallet, mint, fromWallet.publicKey);
  const toTokenAccount = await getOrCreateAssociatedTokenAccount(connection, fromWallet, mint, toWallet.publicKey);
  console.log('fromTokenAccount:', fromTokenAccount.address.toBase58());
  console.log('toTokenAccount:', toTokenAccount.address.toBase58());

  {
    const fromTokenAccountInfo = await getAccount(connection, fromTokenAccount.address);
    const toTokenAccountInfo = await getAccount(connection, toTokenAccount.address);
    console.log('fromTokenBalance:', fromTokenAccountInfo.amount);
    console.log('toTokenBalance:', toTokenAccountInfo.amount);
  }

  // transfer SOL
  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: fromWallet.publicKey,
      toPubkey: toWallet.publicKey,
      lamports: 100,
    }),
  );
  // burn token
  transaction.add(
    createBurnInstruction(fromTokenAccount.address, mint, fromWallet.publicKey, 200, [], TOKEN_PROGRAM_ID),
  );
  // add memo
  transaction.add(createMemoInstruction('Just a memo', [fromWallet.publicKey]));

  // send transaction
  const signature = await sendAndConfirmTransaction(connection, transaction, [fromWallet]);
  console.log('tx:', `https://solscan.io/tx/${signature}?cluster=devnet`);

  {
    const fromTokenAccountInfo = await getAccount(connection, fromTokenAccount.address);
    const toTokenAccountInfo = await getAccount(connection, toTokenAccount.address);
    console.log('fromTokenBalance:', fromTokenAccountInfo.amount);
    console.log('toTokenBalance:', toTokenAccountInfo.amount);
  }
})();

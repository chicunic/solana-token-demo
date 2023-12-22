import { createMint, getOrCreateAssociatedTokenAccount, mintTo, transfer } from '@solana/spl-token';
import { Connection, Keypair, PublicKey, clusterApiUrl } from '@solana/web3.js';
import 'dotenv/config';
import { decodeBase58 } from 'ethers';

const fromWalletPrivateHex = decodeBase58(process.env.FROM_WALLET_PRIVATE_KEY as string).toString(16);
// const toWalletPrivateHex = decodeBase58(process.env.TO_WALLET_PRIVATE_KEY as string).toString(16);
const toWalletPublicKeyBase58 = process.env.TO_WALLET_PUBLIC_KEY as string;

/**
 * This function contains following operations:
 * 1. Create a token
 * 2. Mint token to `fromWallet`
 * 3. Transfer token from `fromWallet` to `toWallet`
 */
(async function main() {
  // prepare wallets
  const fromWallet = Keypair.fromSecretKey(Uint8Array.from(Buffer.from(fromWalletPrivateHex, 'hex')));
  const toWalletPublicKey = new PublicKey(toWalletPublicKeyBase58);

  // create your own fungible token with 9 decimals
  const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
  const mint = await createMint(connection, fromWallet, fromWallet.publicKey, null, 9);

  // prepare token accounts
  const fromTokenAccount = await getOrCreateAssociatedTokenAccount(connection, fromWallet, mint, fromWallet.publicKey);
  const toTokenAccount = await getOrCreateAssociatedTokenAccount(connection, fromWallet, mint, toWalletPublicKey);
  console.log('fromTokenAccount:', fromTokenAccount.address.toBase58());
  console.log('toTokenAccount:', toTokenAccount.address.toBase58());

  // mint token
  {
    const signature = await mintTo(
      connection,
      fromWallet,
      mint,
      fromTokenAccount.address,
      fromWallet.publicKey,
      100000000000n,
    );
    console.log('tx:', `https://solscan.io/tx/${signature}?cluster=devnet`);
  }

  // transfer token
  {
    const signature = await transfer(
      connection,
      fromWallet,
      fromTokenAccount.address,
      toTokenAccount.address,
      fromWallet.publicKey,
      50,
    );
    console.log('tx:', `https://solscan.io/tx/${signature}?cluster=devnet`);
  }
})();

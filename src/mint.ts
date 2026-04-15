import { type Address, type KeyPairSigner, type Rpc, type SolanaRpcApi, generateKeyPairSigner } from '@solana/kit';
import { getCreateAccountInstruction } from '@solana-program/system';
import {
  TOKEN_PROGRAM_ADDRESS,
  findAssociatedTokenPda,
  getCreateAssociatedTokenIdempotentInstruction,
  getInitializeMintInstruction,
  getMintSize,
  getMintToInstruction,
  getTransferInstruction,
} from '@solana-program/token';
import type { SendTransaction } from './helpers.js';

export interface MintParams {
  rpc: Rpc<SolanaRpcApi>;
  payer: KeyPairSigner;
  toWalletAddress: Address;
  sendTransaction: SendTransaction;
}

export interface MintResult {
  mintAddress: Address;
  fromAta: Address;
  toAta: Address;
  mintSignature: string;
  transferSignature: string;
}

export async function createAndMintToken({
  rpc,
  payer,
  toWalletAddress,
  sendTransaction,
}: MintParams): Promise<MintResult> {
  const mint = await generateKeyPairSigner();
  const mintSize = getMintSize();
  const mintRent = await rpc.getMinimumBalanceForRentExemption(BigInt(mintSize)).send();

  await sendTransaction(payer, [
    getCreateAccountInstruction({
      payer,
      newAccount: mint,
      space: mintSize,
      lamports: mintRent,
      programAddress: TOKEN_PROGRAM_ADDRESS,
    }),
    getInitializeMintInstruction({
      mint: mint.address,
      decimals: 9,
      mintAuthority: payer.address,
    }),
  ]);

  const [fromAta] = await findAssociatedTokenPda({
    owner: payer.address,
    mint: mint.address,
    tokenProgram: TOKEN_PROGRAM_ADDRESS,
  });
  const [toAta] = await findAssociatedTokenPda({
    owner: toWalletAddress,
    mint: mint.address,
    tokenProgram: TOKEN_PROGRAM_ADDRESS,
  });

  const mintSignature = await sendTransaction(payer, [
    getCreateAssociatedTokenIdempotentInstruction({
      payer,
      ata: fromAta,
      owner: payer.address,
      mint: mint.address,
    }),
    getMintToInstruction({
      mint: mint.address,
      token: fromAta,
      mintAuthority: payer,
      amount: 100_000_000_000n,
    }),
  ]);

  const transferSignature = await sendTransaction(payer, [
    getCreateAssociatedTokenIdempotentInstruction({
      payer,
      ata: toAta,
      owner: toWalletAddress,
      mint: mint.address,
    }),
    getTransferInstruction({
      source: fromAta,
      destination: toAta,
      authority: payer,
      amount: 50n,
    }),
  ]);

  return {
    mintAddress: mint.address,
    fromAta,
    toAta,
    mintSignature,
    transferSignature,
  };
}

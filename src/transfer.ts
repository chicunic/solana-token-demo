import { type Address, type KeyPairSigner, type Rpc, type SolanaRpcApi } from '@solana/kit';
import { getAddMemoInstruction } from '@solana-program/memo';
import { getTransferSolInstruction } from '@solana-program/system';
import {
  TOKEN_PROGRAM_ADDRESS,
  fetchToken,
  findAssociatedTokenPda,
  getTransferInstruction,
} from '@solana-program/token';
import type { SendTransaction } from './helpers.js';

export interface TransferParams {
  rpc: Rpc<SolanaRpcApi>;
  payer: KeyPairSigner;
  toWalletAddress: Address;
  mintAddress: Address;
  solAmount: bigint;
  tokenAmount: bigint;
  memo: string;
  sendTransaction: SendTransaction;
}

export interface TransferResult {
  fromAta: Address;
  toAta: Address;
  signature: string;
  fromTokenBalance: bigint;
  toTokenBalance: bigint;
}

export async function transferSolAndToken({
  rpc,
  payer,
  toWalletAddress,
  mintAddress,
  solAmount,
  tokenAmount,
  memo,
  sendTransaction,
}: TransferParams): Promise<TransferResult> {
  const [fromAta] = await findAssociatedTokenPda({
    owner: payer.address,
    mint: mintAddress,
    tokenProgram: TOKEN_PROGRAM_ADDRESS,
  });
  const [toAta] = await findAssociatedTokenPda({
    owner: toWalletAddress,
    mint: mintAddress,
    tokenProgram: TOKEN_PROGRAM_ADDRESS,
  });

  const signature = await sendTransaction(payer, [
    getTransferSolInstruction({
      source: payer,
      destination: toWalletAddress,
      amount: solAmount,
    }),
    getTransferInstruction({
      source: fromAta,
      destination: toAta,
      authority: payer,
      amount: tokenAmount,
    }),
    getAddMemoInstruction({
      memo,
      signers: [payer],
    }),
  ]);

  const fromTokenAccount = await fetchToken(rpc, fromAta);
  const toTokenAccount = await fetchToken(rpc, toAta);

  return {
    fromAta,
    toAta,
    signature,
    fromTokenBalance: fromTokenAccount.data.amount,
    toTokenBalance: toTokenAccount.data.amount,
  };
}

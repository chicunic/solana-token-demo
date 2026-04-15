import {
  type Address,
  type KeyPairSigner,
  type Lamports,
  type Rpc,
  type SolanaRpcApi,
  createSolanaRpc,
  createSolanaRpcSubscriptions,
  generateKeyPairSigner,
} from '@solana/kit';
import { getCreateAccountInstruction } from '@solana-program/system';
import {
  TOKEN_PROGRAM_ADDRESS,
  findAssociatedTokenPda,
  getCreateAssociatedTokenIdempotentInstruction,
  getInitializeMintInstruction,
  getMintSize,
  getMintToInstruction,
} from '@solana-program/token';
import type { SendTransaction } from '../src/helpers.js';
import { createTransactionSender } from '../src/helpers.js';

export const rpc = createSolanaRpc('http://localhost:8899');
export const rpcSubscriptions = createSolanaRpcSubscriptions('ws://localhost:8900');
export const buildAndSendTransaction: SendTransaction = createTransactionSender(rpc, rpcSubscriptions);

export async function createFundedWallet(lamports = 10_000_000_000n as Lamports): Promise<KeyPairSigner> {
  const wallet = await generateKeyPairSigner();
  const signature = await rpc.requestAirdrop(wallet.address, lamports).send();

  let confirmed = false;
  while (!confirmed) {
    const { value } = await rpc.getSignatureStatuses([signature]).send();
    const status = value[0]?.confirmationStatus;
    confirmed = status === 'confirmed' || status === 'finalized';
    if (!confirmed) await new Promise((r) => setTimeout(r, 500));
  }

  return wallet;
}

export interface MintSetupResult {
  mint: KeyPairSigner;
  fromAta: Address;
  toAta: Address;
}

export async function createMintWithTokens(
  rpc: Rpc<SolanaRpcApi>,
  sendTransaction: SendTransaction,
  payer: KeyPairSigner,
  toOwner: Address,
  amount: bigint,
): Promise<MintSetupResult> {
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
    owner: toOwner,
    mint: mint.address,
    tokenProgram: TOKEN_PROGRAM_ADDRESS,
  });

  await sendTransaction(payer, [
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
      amount,
    }),
    getCreateAssociatedTokenIdempotentInstruction({
      payer,
      ata: toAta,
      owner: toOwner,
      mint: mint.address,
    }),
  ]);

  return { mint, fromAta, toAta };
}

import { generateKeyPairSigner } from '@solana/kit';
import { fetchToken } from '@solana-program/token';
import { describe, expect, it } from 'vitest';
import { createAndMintToken } from '../src/mint.js';
import { buildAndSendTransaction, createFundedWallet, rpc } from './setup.js';

describe('mint', () => {
  it('should create a token, mint, and transfer', async () => {
    const payer = await createFundedWallet();
    const toWallet = await generateKeyPairSigner();

    const result = await createAndMintToken({
      rpc,
      payer,
      toWalletAddress: toWallet.address,
      sendTransaction: buildAndSendTransaction,
    });

    expect(result.mintAddress).toBeTruthy();
    expect(result.fromAta).toBeTruthy();
    expect(result.toAta).toBeTruthy();

    const fromTokenAccount = await fetchToken(rpc, result.fromAta);
    const toTokenAccount = await fetchToken(rpc, result.toAta);
    expect(fromTokenAccount.data.amount).toBe(99_999_999_950n);
    expect(toTokenAccount.data.amount).toBe(50n);
  });
});

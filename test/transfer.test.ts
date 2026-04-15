import { generateKeyPairSigner } from '@solana/kit';
import { describe, expect, it } from 'vitest';
import { transferSolAndToken } from '../src/transfer.js';
import { buildAndSendTransaction, createFundedWallet, createMintWithTokens, rpc } from './setup.js';

describe('transfer', () => {
  it('should transfer SOL, transfer token, and add memo in one transaction', async () => {
    const payer = await createFundedWallet();
    const toWallet = await generateKeyPairSigner();
    const { mint } = await createMintWithTokens(rpc, buildAndSendTransaction, payer, toWallet.address, 1_000n);

    const result = await transferSolAndToken({
      rpc,
      payer,
      toWalletAddress: toWallet.address,
      mintAddress: mint.address,
      solAmount: 1_000_000_000n,
      tokenAmount: 200n,
      memo: 'Just a memo',
      sendTransaction: buildAndSendTransaction,
    });

    expect(result.signature).toBeTruthy();

    const toBalance = await rpc.getBalance(toWallet.address).send();
    expect(toBalance.value).toBe(1_000_000_000n);
    expect(result.fromTokenBalance).toBe(800n);
    expect(result.toTokenBalance).toBe(200n);
  });
});

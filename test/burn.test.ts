import { describe, expect, it } from 'vitest';
import { transferSolAndBurnToken } from '../src/burn.js';
import { buildAndSendTransaction, createFundedWallet, createMintWithTokens, rpc } from './setup.js';

describe('burn', () => {
  it('should transfer SOL, burn token, and add memo in one transaction', async () => {
    const payer = await createFundedWallet();
    const toWallet = await createFundedWallet();
    const { mint } = await createMintWithTokens(rpc, buildAndSendTransaction, payer, toWallet.address, 1_000n);

    const result = await transferSolAndBurnToken({
      rpc,
      payer,
      toWalletAddress: toWallet.address,
      mintAddress: mint.address,
      solAmount: 1_000_000_000n,
      burnAmount: 200n,
      memo: 'Just a memo',
      sendTransaction: buildAndSendTransaction,
    });

    expect(result.signature).toBeTruthy();
    expect(result.fromTokenBalance).toBe(800n);
  });
});

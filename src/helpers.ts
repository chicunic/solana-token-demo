import {
  type Instruction,
  type Rpc,
  type RpcSubscriptions,
  type SolanaRpcApi,
  type SolanaRpcSubscriptionsApi,
  type TransactionSigner,
  appendTransactionMessageInstructions,
  assertIsSendableTransaction,
  assertIsTransactionWithBlockhashLifetime,
  createTransactionMessage,
  getSignatureFromTransaction,
  pipe,
  sendAndConfirmTransactionFactory,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  signTransactionMessageWithSigners,
} from '@solana/kit';
import { rpc as defaultRpc, rpcSubscriptions as defaultRpcSubscriptions } from './config.js';

export type SendTransaction = (payer: TransactionSigner, instructions: Instruction[]) => Promise<string>;

export function createTransactionSender(
  rpc: Rpc<SolanaRpcApi> = defaultRpc,
  rpcSubscriptions: RpcSubscriptions<SolanaRpcSubscriptionsApi> = defaultRpcSubscriptions,
): SendTransaction {
  const sendAndConfirm = sendAndConfirmTransactionFactory({ rpc, rpcSubscriptions });

  return async function buildAndSendTransaction(payer, instructions) {
    const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

    const transactionMessage = pipe(
      createTransactionMessage({ version: 0 }),
      (tx) => setTransactionMessageFeePayerSigner(payer, tx),
      (tx) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
      (tx) => appendTransactionMessageInstructions(instructions, tx),
    );

    const signedTx = await signTransactionMessageWithSigners(transactionMessage);
    assertIsSendableTransaction(signedTx);
    assertIsTransactionWithBlockhashLifetime(signedTx);

    const signature = getSignatureFromTransaction(signedTx);
    await sendAndConfirm(signedTx, { commitment: 'confirmed' });
    return signature;
  };
}

export const buildAndSendTransaction: SendTransaction = createTransactionSender();

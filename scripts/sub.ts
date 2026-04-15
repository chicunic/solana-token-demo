import { address } from '@solana/kit';
import { env, rpc, rpcSubscriptions } from '../src/config.js';

const toWalletAddress = address(env.toWalletPublicKey);
const abortController = new AbortController();

const logsSubscription = await rpcSubscriptions
  .logsNotifications({ mentions: [toWalletAddress] }, { commitment: 'confirmed' })
  .subscribe({ abortSignal: abortController.signal });

for await (const notification of logsSubscription) {
  const { signature } = notification.value;
  console.log('signature:', signature);

  const transaction = await rpc
    .getTransaction(signature, { encoding: 'jsonParsed', maxSupportedTransactionVersion: 0 })
    .send();
  console.log(JSON.stringify(transaction?.transaction.message, null, 2));
}

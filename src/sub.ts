import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import 'dotenv/config';

const toWalletPublicKeyBase58 = process.env.TO_WALLET_PUBLIC_KEY as string;

(async function sub() {
  const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

  // Create a test wallet to listen to
  const toWalletPublicKey = new PublicKey(toWalletPublicKeyBase58);

  // Register a callback to listen to the wallet (ws subscription)
  connection.onLogs(
    toWalletPublicKey,
    async (logs, _context) => {
      const { signature } = logs;
      console.log('signature:', signature);

      const signatureStatus = await connection.getParsedTransaction(signature);
      const instructions = signatureStatus?.transaction.message.instructions;
      console.log(JSON.stringify(instructions, null, 2));
    },
    'confirmed',
  );
})();

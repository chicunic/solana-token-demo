import { createSolanaRpc } from '@solana/kit';

export async function setup() {
  const rpc = createSolanaRpc('http://localhost:8899');
  try {
    await rpc.getHealth().send();
  } catch {
    console.warn('\nsolana-test-validator is not running, skipping tests\n');
    process.exit(0);
  }
}

import {
  type KeyPairSigner,
  createKeyPairSignerFromBytes,
  createSolanaRpc,
  createSolanaRpcSubscriptions,
  getBase58Encoder,
} from '@solana/kit';
import 'dotenv/config';

const rpcUrl = process.env.RPC_URL ?? 'http://localhost:8899';
const wsUrl = process.env.WS_URL ?? 'ws://localhost:8900';

export const rpc = createSolanaRpc(rpcUrl);
export const rpcSubscriptions = createSolanaRpcSubscriptions(wsUrl);

export const env = {
  fromWalletPrivateKey: process.env.FROM_WALLET_PRIVATE_KEY as string,
  toWalletPrivateKey: process.env.TO_WALLET_PRIVATE_KEY as string,
  toWalletPublicKey: process.env.TO_WALLET_PUBLIC_KEY as string,
  tokenPublicKey: process.env.TOKEN_PUBLIC_KEY as string,
};

const base58 = getBase58Encoder();

export async function loadSigner(base58PrivateKey: string): Promise<KeyPairSigner> {
  const privateKey = base58.encode(base58PrivateKey);
  return createKeyPairSignerFromBytes(privateKey);
}

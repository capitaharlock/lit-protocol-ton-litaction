import ethers from 'ethers';
import { LitNodeClient } from '@lit-protocol/lit-node-client';
import {
    AuthMethodScope,
    LitNetwork,
    ProviderType,
} from '@lit-protocol/constants';
import {
    EthWalletProvider,
    LitAuthClient,
} from '@lit-protocol/lit-auth-client';
import { LitAbility, LitActionResource } from '@lit-protocol/auth-helpers';
import { api } from '@lit-protocol/wrapped-keys';
import { getEnv } from './utils';
import { TonClient } from '@tonclient/core';
import { libNode } from '@tonclient/lib-node';
import { signTONTransaction } from './signTonTransaction';

const { importPrivateKey } = api;

TonClient.useBinaryLibrary(libNode);

const LIT_RELAYER_API_KEY = getEnv('LIT_RELAYER_API_KEY');

export const doTheThing = async () => {
    let litNodeClient: LitNodeClient;

    try {
        console.log('🔄 Generating a wallet for the user...');
        let userEthersSigner = ethers.Wallet.createRandom();
        userEthersSigner = userEthersSigner.connect(
            new ethers.providers.JsonRpcProvider(
                'https://rpc-vesuvius-as793xpg5g.t.conduit.xyz',
            ),
        );
        console.log(
            `✅ Created the Ethereum wallet: ${userEthersSigner.address}`,
        );

        console.log('🔄 Connecting to Lit network...');
        litNodeClient = new LitNodeClient({
            litNetwork: LitNetwork.DatilDev,
            debug: false,
        });
        await litNodeClient.connect();
        console.log('✅ Connected to Lit network');

        console.log('🔄 Initializing a Lit Auth client...');
        const litAuthClient = new LitAuthClient({
            litRelayConfig: {
                relayApiKey: LIT_RELAYER_API_KEY,
            },
            rpcUrl: 'https://rpc-vesuvius-as793xpg5g.t.conduit.xyz',
            litNodeClient,
        });
        console.log('✅ Initialized a Lit Auth client');

        console.log('🔄 Initializing Lit Auth EthWallet provider...');
        const userAuthProvider = litAuthClient.initProvider(
            ProviderType.EthWallet,
        );
        console.log('✅ Initialized Lit Auth EthWallet provider');

        console.log('🔄 Authenticating Lit Auth EthWallet provider...');
        const userAuthMethod = await EthWalletProvider.authenticate({
            signer: userEthersSigner,
            litNodeClient,
        });
        console.log('✅ Authenticated Lit Auth EthWallet provider');

        console.log('🔄 Minting PKP via Relayer...');
        const mintedPkpTransactionHash =
            await userAuthProvider.mintPKPThroughRelayer(userAuthMethod, {
                permittedAuthMethodScopes: [[AuthMethodScope.SignAnything]],
            });
        console.log(
            `✅ Minted PKP via Relayer. Transaction hash: ${mintedPkpTransactionHash}`,
        );

        console.log('🔄 Fetching PKPs for user wallet...');
        const pkps =
            await userAuthProvider.fetchPKPsThroughRelayer(userAuthMethod);
        console.log(`✅ Fetched ${pkps.length} PKP(s) for user wallet`);

        console.log(
            "🔄 Generating PKP Session Signatures with the user's PKP...",
        );
        const pkpSessionSigs = await litNodeClient.getPkpSessionSigs({
            pkpPublicKey: pkps[0].publicKey,
            authMethods: [
                await EthWalletProvider.authenticate({
                    signer: userEthersSigner,
                    litNodeClient,
                    expiration: new Date(
                        Date.now() + 1000 * 60 * 10,
                    ).toISOString(), // 10 minutes
                }),
            ],
            resourceAbilityRequests: [
                {
                    resource: new LitActionResource('*'),
                    ability: LitAbility.LitActionExecution,
                },
            ],
            expiration: new Date(Date.now() + 1000 * 60 * 10).toISOString(), // 10 minutes
        });
        console.log('✅ Generated PKP Session Signatures');

        /** Create TON sample wallet */
        console.log('🔄 Generating a TON wallet for the user...');
        const tonClient = new TonClient({
            network: {
                server_address: 'https://testnet.toncenter.com/api/v2/jsonRPC',
            },
        });
        const tonWallet = await tonClient.crypto.generate_random_sign_keys();
        console.log(
            `✅ Created the TON wallet with public key: ${tonWallet.public}`,
        );

        /** Add TON key */
        console.log(
            "🔄 Importing user's TON private key as a Lit Wrapped Key...",
        );
        const pkpAddress = await importPrivateKey({
            pkpSessionSigs,
            litNodeClient,
            privateKey: tonWallet.secret,
            publicKey: pkps[0].publicKey,
            keyType: 'ed25519',
        });
        console.log(
            `✅ Imported TON private key, and attached to PKP with address: ${pkpAddress}`,
        );

        //** Call the new function to sign a TON transaction */
        const signedTONTransactionSignature = await signTONTransaction({
            tonWallet: {
                publicKey: tonWallet.public,
            },
            pkpSessionSigs,
            litNodeClient,
            wrappedKeysPkpAddress: pkpAddress,
            wrappedKeysPublicKey: pkps[0].publicKey,
        });
        console.log(
            `✅ Signed TON transaction. Signature: ${signedTONTransactionSignature}`,
        );
    } catch (error) {
        console.error(error);
    } finally {
        litNodeClient!.disconnect();
    }
};

await doTheThing();

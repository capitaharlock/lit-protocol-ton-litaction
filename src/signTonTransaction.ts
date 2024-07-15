import { TonClient } from '@tonclient/core';
import { libNode } from '@tonclient/lib-node';
import { LitNodeClient } from '@lit-protocol/lit-node-client';

TonClient.useBinaryLibrary(libNode);

interface SignTONTransactionParams {
    tonWallet: {
        publicKey: string;
    };
    pkpSessionSigs: any;
    litNodeClient: LitNodeClient;
    wrappedKeysPkpAddress: string;
    wrappedKeysPublicKey: string;
}

export const signTONTransaction = async ({
    tonWallet,
    pkpSessionSigs,
    litNodeClient,
    wrappedKeysPkpAddress,
    wrappedKeysPublicKey,
}: SignTONTransactionParams) => {
    console.log('🔄 Signing a TON transaction with Lit Action...');

    // Create a simple transfer message
    const message = {
        address: 'EQCNgrEeqQRYtYsLRZ6yX92GkeTEqFJMmFN2nzRm_6D6SHvI', // recipient address
        amount: '10000000', // 0.01 TON
        bounce: false,
        payload: '', // Empty payload for a simple transfer
    };

    // Prepare the transaction
    const unsignedTransaction = {
        chain: 1,
        to: message.address,
        value: message.amount,
        seqno: 1,
        timeout: Math.floor(Date.now() / 1000) + 60,
        bounce: message.bounce,
        payload: message.payload,
        sendMode: 3,
    };

    const litActionCode = `
      (async () => {
          const LIT_PREFIX = 'lit_';

          let decryptedPrivateKey;
          try {
              decryptedPrivateKey = await Lit.Actions.decryptToSingleNode({
                  accessControlConditions,
                  chain: 'ethereum',
                  ciphertext: null,
                  dataToEncryptHash: null,
                  authSig: null,
              });
          } catch (error) {
              Lit.Actions.setResponse({
                  response: JSON.stringify({ error: error.message }),
              });
              return;
          }

          if (!decryptedPrivateKey) {
              Lit.Actions.setResponse({
                  response: JSON.stringify({ error: "Failed to decrypt private key" }),
              });
              return;
          }

          const privateKey = decryptedPrivateKey.startsWith(LIT_PREFIX)
              ? decryptedPrivateKey.slice(LIT_PREFIX.length)
              : decryptedPrivateKey;

          const sigShare = await LitActions.signEcdsa({
              toSign: dataToSign,
              publicKey,
              sigName: sigName,
          });

          Lit.Actions.setResponse({
              response: JSON.stringify({
                  privateKey: privateKey,
                  signature: sigShare.signature,
              }),
          });
      })();
    `;

    const accessControlConditions = [
        {
            contractAddress: '',
            standardContractType: '',
            chain: 1,
            method: '',
            parameters: [':userAddress'],
            returnValueTest: {
                comparator: '=',
                value: wrappedKeysPkpAddress,
            },
        },
    ];

    try {
        const litActionResult = await litNodeClient.executeJs({
            sessionSigs: pkpSessionSigs,
            code: litActionCode,
            jsParams: {
                accessControlConditions,
                publicKey: wrappedKeysPublicKey,
                sigName: 'ton_sig',
                dataToSign: unsignedTransaction,
            },
        });
        /*
        sample: https://github.com/LIT-Protocol/js-sdk/blob/master/packages/wrapped-keys/src/lib/lit-actions-client/sign-transaction.ts
        const result = await litNodeClient.executeJs({
          sessionSigs: pkpSessionSigs,
          ipfsId: litActionIpfsCid,
          jsParams: {
            pkpAddress,
            ciphertext,
            dataToEncryptHash,
            unsignedTransaction,
            broadcast,
            accessControlConditions,
          },
        });
        */
        console.log('✅ LIT ACTION Result:', litActionResult);

        return null;
    } catch (error) {
        console.error('Error executing Lit Action:', error);
        throw error;
    }
};

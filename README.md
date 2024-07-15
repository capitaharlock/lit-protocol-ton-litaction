WALLET WITH LIT: 0x112A14065bAD54aD4d77468C7F71fC61C31cF795
https://datil-dev-faucet.vercel.app/

# TON signature test

## Running this Example

### Setting Up the `.env` File

Make a copy of the provided `.env.example` file and name it `.env`:

```bash
cp .env.example .env
```

Within the `.env` there are the ENVs:

`LIT_RELAYER_API_KEY` - **Required** The Lit API key to authorize use of the Lit Relayer. If you do not have one, one can be obtained using [this form](https://docs.google.com/forms/d/e/1FAIpQLSeVraHsp1evK_9j-8LpUBiEJWFn4G5VKjOWBmHFjxFRJZJdrg/viewform).
`ETHEREUM_PRIVATE_KEY` - **Required** The corresponding Ethereum address needs to have Lit tokens on the [Chronicle Vesuvius chain](https://developer.litprotocol.com/connecting-to-a-lit-network/lit-blockchains/chronicle-vesuvius) as it will be used to mint the new PKP, and fund the generated Ethereum address. If you do not have Lit test tokens, you can get some using [the faucet](https://datil-dev-faucet.vercel.app/).

### Running the Example

After setting up the `.env` file, you can run the code example using the NPM script: `start`:

```bash
yarn start
```

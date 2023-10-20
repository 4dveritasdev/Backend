import {BlockchainAddress} from "@partisiablockchain/abi-client-ts";
import BN from "bn.js";
import {initialize, batch_mint} from "./nft_contract";
import {deployContractWithBinderId} from "./pub_deploy"
import {Client} from "./utils/Client";
import {TransactionSender} from "./utils/TransactionSender";

var fs = require("fs");

const TESTNET_URL = "https://node1.testnet.partisiablockchain.com";
const client = new Client(TESTNET_URL);

let SENDER_PRIVATE_KEY: string = "4931e8190e5ef42c225c86845abe7934dd704ca9d133d5dc7128c8e04db00ca6";
//4931e8190e5ef42c225c86845abe7934dd704ca9d133d5dc7128c8e04db00ca6
//2e4fd54916e7e953cffd11bf13cc952e07863f957f8264be4f9ea1a1d9d5904c

export const initClient = async () => {
  try {
    console.log("initClient");
    
    // This contract address is pub-deploy
    let contractAddress: BlockchainAddress = BlockchainAddress.fromString(
        "0197a0e238e924025bad144aa0c4913e46308f9a4d");

    const transactionSender = TransactionSender.create(client, SENDER_PRIVATE_KEY);

    const initPayload = initialize("name", "symbol", "https://example.com");

    const wasmBytes: Buffer = fs.readFileSync("./web3/nft_contract.wasm");
    const abiBytes: Buffer = fs.readFileSync("./web3/nft_contract.abi");
    const rpc = deployContractWithBinderId(wasmBytes, abiBytes, initPayload, 1);

    // Send the transaction
    const transactionPointer = await transactionSender.sendAndSign(
        {
          address: contractAddress,
          rpc: rpc,
        },
        new BN(2500000),
    );

    const txIdentifier = transactionPointer.transactionPointer.identifier.toString("hex");
    // eslint-disable-next-line no-console
    console.log("Sent input in transaction: " + txIdentifier);
    const deployedAddress = '02' + txIdentifier.slice(txIdentifier.length - 40);
    return deployedAddress;

  } catch (error) {
    console.log(error);
    return null;
  }
};

export const batchMint = async (contract_address: string, qrcodes: string[]) => {
  try {
    console.log("batch mint");
    
    // This contract address is pub-deploy
    let contractAddress: BlockchainAddress = BlockchainAddress.fromString(
        contract_address);

    const transactionSender = TransactionSender.create(client, SENDER_PRIVATE_KEY);
    const rpc = batch_mint('00d8211697d353fe632abe6d290a82b2118b972cad', 'QR Code', qrcodes, 'a', 'minted', '2023.10.20', '2023.10.20', '...');

    // Send the transaction
    const transactionPointer = await transactionSender.sendAndSign(
        {
          address: contractAddress,
          rpc: rpc,
        },
        new BN(10100000),
    );

    const txIdentifier = transactionPointer.transactionPointer.identifier.toString("hex");
    // eslint-disable-next-line no-console
    console.log("Sent input in transaction: " + txIdentifier);

  } catch (error) {
    console.log(error);
  }
};

// (async () => {
//   await initClient();
// })()
//     .catch(e => {
//       // Deal with the fact the chain failed
//     });
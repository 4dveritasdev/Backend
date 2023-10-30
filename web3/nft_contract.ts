/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import BN from "bn.js";
import {
  AbiParser,
  AbstractBuilder, BigEndianReader,
  FileAbi, FnKinds, FnRpcBuilder, RpcReader,
  ScValue,
  ScValueEnum, ScValueOption,
  ScValueStruct,
  StateReader, TypeIndex,
  BlockchainAddress
} from "@partisiablockchain/abi-client-ts";
import {BigEndianByteOutput} from "@secata-public/bitmanipulation-ts";
var fs = require("fs");


const fileAbi: FileAbi = new AbiParser(fs.readFileSync("./web3/nft_contract.abi")).parseAbi();
// console.log(abiBytes);

// const fileAbi: FileAbi = new AbiParser(Buffer.from(
//   "5042434142490904000502000000000301000000085472616e736665720000000200000002746f0d00000006616d6f756e7405010000000a546f6b656e537461746500000007000000046e616d650b00000008646563696d616c73010000000673796d626f6c0b000000056f776e65720d0000000c746f74616c5f737570706c79050000000862616c616e6365730f0d0500000007616c6c6f7765640f0d0f0d05010000000b536563726574566172496400000001000000067261775f69640300000006010000000a696e697469616c697a65ffffffff0f00000004000000046e616d650b0000000673796d626f6c0b00000008646563696d616c73010000000c746f74616c5f737570706c790502000000087472616e73666572010000000200000002746f0d00000006616d6f756e7405020000000d62756c6b5f7472616e736665720200000001000000097472616e73666572730e0000020000000d7472616e736665725f66726f6d03000000030000000466726f6d0d00000002746f0d00000006616d6f756e7405020000001262756c6b5f7472616e736665725f66726f6d04000000020000000466726f6d0d000000097472616e73666572730e00000200000007617070726f76650500000002000000077370656e6465720d00000006616d6f756e74050001",
//   "hex"
// )).parseAbi();
// console.log(fileAbi);

type Option<K> = K | undefined;

export interface Transfer {
  to: BlockchainAddress;
  amount: BN;
}

export function newTransfer(to: BlockchainAddress, amount: BN): Transfer {
  return {to, amount}
}

function fromScValueTransfer(structValue: ScValueStruct): Transfer {
  return {
    to: BlockchainAddress.fromBuffer(structValue.getFieldValue("to")!.addressValue().value),
    amount: structValue.getFieldValue("amount")!.asBN(),
  };
}

function buildRpcTransfer(value: Transfer, builder: AbstractBuilder) {
  const structBuilder = builder.addStruct();
  structBuilder.addAddress(value.to.asBuffer());
  structBuilder.addU128(value.amount);
}

export interface TokenState {
  name: string;
  decimals: number;
  symbol: string;
  owner: BlockchainAddress;
  totalSupply: BN;
  balances: Map<BlockchainAddress, BN>;
  allowed: Map<BlockchainAddress, Map<BlockchainAddress, BN>>;
}

export function newTokenState(name: string, decimals: number, symbol: string, owner: BlockchainAddress, totalSupply: BN, balances: Map<BlockchainAddress, BN>, allowed: Map<BlockchainAddress, Map<BlockchainAddress, BN>>): TokenState {
  return {name, decimals, symbol, owner, totalSupply, balances, allowed}
}

function fromScValueTokenState(structValue: ScValueStruct): TokenState {
  return {
    name: structValue.getFieldValue("name")!.stringValue(),
    decimals: structValue.getFieldValue("decimals")!.asNumber(),
    symbol: structValue.getFieldValue("symbol")!.stringValue(),
    owner: BlockchainAddress.fromBuffer(structValue.getFieldValue("owner")!.addressValue().value),
    totalSupply: structValue.getFieldValue("total_supply")!.asBN(),
    balances: new Map([...structValue.getFieldValue("balances")!.mapValue().map].map(([k1, v2]) => [BlockchainAddress.fromBuffer(k1.addressValue().value), v2.asBN()])),
    allowed: new Map([...structValue.getFieldValue("allowed")!.mapValue().map].map(([k3, v4]) => [BlockchainAddress.fromBuffer(k3.addressValue().value), new Map([...v4.mapValue().map].map(([k5, v6]) => [BlockchainAddress.fromBuffer(k5.addressValue().value), v6.asBN()]))])),
  };
}

export function deserializeTokenState(bytes: Buffer): TokenState {
  const scValue = new StateReader(bytes, fileAbi.contract).readState();
  return fromScValueTokenState(scValue);
}

export interface SecretVarId {
  rawId: number;
}

export function newSecretVarId(rawId: number): SecretVarId {
  return {rawId}
}

function fromScValueSecretVarId(structValue: ScValueStruct): SecretVarId {
  return {
    rawId: structValue.getFieldValue("raw_id")!.asNumber(),
  };
}

export function initialize(name: string, symbol: string, url_template: string): Buffer {
  const fnBuilder = new FnRpcBuilder("initialize", fileAbi.contract);
  fnBuilder.addString(name);
  fnBuilder.addString(symbol);
  fnBuilder.addString(url_template);
  return fnBuilder.getBytes();
}

export function batch_mint(to:string, key_detail:string[], status:string, mpg_time:string, exp_time:string): Buffer {
  const fnBuilder = new FnRpcBuilder("batch_mint", fileAbi.contract);
  const encodedAddress = Buffer.from(to, "hex");
  fnBuilder.addAddress(encodedAddress);

  let kk = fnBuilder.addVec();
  for (let i = 0; i < key_detail.length; i ++) {
    kk.addString(key_detail[i]);
  }
  fnBuilder.addString(status);
  fnBuilder.addString(mpg_time);
  fnBuilder.addString(exp_time);

  return fnBuilder.getBytes();
}

// export function transfer(to: BlockchainAddress, amount: BN): Buffer {
//   const fnBuilder = new FnRpcBuilder("transfer", fileAbi.contract);
//   fnBuilder.addAddress(to.asBuffer());
//   fnBuilder.addU128(amount);
//   return fnBuilder.getBytes();
// }

// export function bulkTransfer(transfers: Transfer[]): Buffer {
//   const fnBuilder = new FnRpcBuilder("bulk_transfer", fileAbi.contract);
//   const vecBuilder7 = fnBuilder.addVec();
//   for (const vecEntry8 of transfers) {
//     buildRpcTransfer(vecEntry8, vecBuilder7);
//   }
//   return fnBuilder.getBytes();
// }

// export function transferFrom(from: BlockchainAddress, to: BlockchainAddress, amount: BN): Buffer {
//   const fnBuilder = new FnRpcBuilder("transfer_from", fileAbi.contract);
//   fnBuilder.addAddress(from.asBuffer());
//   fnBuilder.addAddress(to.asBuffer());
//   fnBuilder.addU128(amount);
//   return fnBuilder.getBytes();
// }

// export function bulkTransferFrom(from: BlockchainAddress, transfers: Transfer[]): Buffer {
//   const fnBuilder = new FnRpcBuilder("bulk_transfer_from", fileAbi.contract);
//   fnBuilder.addAddress(from.asBuffer());
//   const vecBuilder9 = fnBuilder.addVec();
//   for (const vecEntry10 of transfers) {
//     buildRpcTransfer(vecEntry10, vecBuilder9);
//   }
//   return fnBuilder.getBytes();
// }

// export function approve(spender: BlockchainAddress, amount: BN): Buffer {
//   const fnBuilder = new FnRpcBuilder("approve", fileAbi.contract);
//   fnBuilder.addAddress(spender.asBuffer());
//   fnBuilder.addU128(amount);
//   return fnBuilder.getBytes();
// }


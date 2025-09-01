import { Env, MessageInfo } from "../std/index.js";
import {
  callExecute,
  callInstantiate,
  callQuery,
  Backend,
  BackendApi,
  Instance,
  Querier,
  Storage,
  InstanceOption,
} from "../vm/index.js";
import fs from "fs";
import { bech32 } from "bech32";
import { BackendError } from "../errors/index.js";

class MockBackendApi implements BackendApi {
  bech32Prefix: string;

  constructor(bech32Prefix: string) {
    this.bech32Prefix = bech32Prefix;
  }

  public addrValidate(input: string): void {
    const canonicalized = this.addrCanonicalize(input);
    const humanized = this.addrHumanize(canonicalized);

    if (input !== humanized) {
      throw BackendError.userErr("Invalid input: address not normalized");
    }
  }

  public addrCanonicalize(human: string): Buffer {
    const { prefix: hrp, words } = bech32.decode(human);

    if (hrp.toLowerCase() !== this.bech32Prefix.toLowerCase()) {
      throw BackendError.userErr("Wrong bech32 prefix");
    }

    const bytes = Buffer.from(words);
    validateLength(bytes);

    return bytes;
  }

  public addrHumanize(canonical: Buffer): string {
    validateLength(canonical);

    try {
      return bech32.encode(this.bech32Prefix, canonical);
    } catch (e: any) {
      throw BackendError.userErr("Invalid data to be encoded to bech32");
    }
  }
}

function validateLength(bytes: Buffer): void {
  if (bytes.length === 0 || bytes.length > 255) {
    throw BackendError.userErr("Invalid canonical address length");
  }
}


class MockQuerier implements Querier {
  public queryRaw(request: Buffer): Buffer {
    return Buffer.allocUnsafe(0);
  }
}

class MockStorage implements Storage {
  data: Map<string, Buffer>;

  constructor() {
    this.data = new Map<string, Buffer>();
  }

  public get(key: Buffer): Buffer {
    return this.data.get(key.toString("base64"));
  }

  public set(key: Buffer, value: Buffer): void {
    this.data.set(key.toString("base64"), value);
  }

  public remove(key: Buffer): void {
    this.data.delete(key.toString("base64"));
  }
}

(async () => {
  try {
    const code = fs.readFileSync("./contracts/cw20.wasm");
    const backend = new Backend(
      new MockBackendApi("osmo"),
      new MockStorage(),
      new MockQuerier()
    );
    const options: InstanceOption = {
      gasLimit: 1_000_000_000_000n,
      printDebug: true,
    };
    const memoryLimit = 16384;
    const instance = await Instance.fromCode(
      code,
      backend,
      options,
      memoryLimit
    );

    const env: Env = {
      block: {
        height: 1,
        time: new Date().getUTCMilliseconds().toString(),
        chain_id: "chainid",
      },
      transaction: null,
      contract: {
        address: "contractaddr",
      },
    };

    const sender = "osmo19r75m986sfx33nqhxp6uwp74yggnp9eu9gyczy";

    const info: MessageInfo = {
      sender,
      funds: [
        {
          denom: "osmo",
          amount: 0n.toString(),
        },
      ],
    };

    const instantiateMsg = {
      name: "wasm token",
      symbol: "wasm",
      decimals: 9,
      initial_balances: [
        {
          address: sender,
          amount: "1000000000",
        },
      ],
      mint: null,
      marketing: null,
    };
    let res = callInstantiate(
      instance,
      env,
      info,
      Buffer.from(JSON.stringify(instantiateMsg), "utf8")
    );
    let resJson = JSON.parse(res.toString("utf8"));
    console.log(resJson);

    let queryMsg = {
      balance: {
        address: sender,
      },
    };
    res = callQuery(
      instance,
      env,
      Buffer.from(JSON.stringify(queryMsg), "utf8")
    );
    resJson = JSON.parse(res.toString("utf8"));
    console.log(Buffer.from(resJson["ok"], "base64").toString("utf8"));

    const recipient = "osmo1y062gcc770rt8muthw7qduf78wfs5mlv7k3acg";

    const executeMsg = {
      transfer: {
        recipient,
        amount: "1000",
      },
    };
    res = callExecute(
      instance,
      env,
      info,
      Buffer.from(JSON.stringify(executeMsg), "utf8")
    );
    resJson = JSON.parse(res.toString("utf8"));
    console.log(JSON.stringify(resJson, null, 2));

    queryMsg = {
      balance: {
        address: sender,
      },
    };
    res = callQuery(
      instance,
      env,
      Buffer.from(JSON.stringify(queryMsg), "utf8")
    );
    resJson = JSON.parse(res.toString("utf8"));
    console.log(Buffer.from(resJson["ok"], "base64").toString("utf8"));

    queryMsg = {
      balance: {
        address: recipient,
      },
    };
    res = callQuery(
      instance,
      env,
      Buffer.from(JSON.stringify(queryMsg), "utf8")
    );
    resJson = JSON.parse(res.toString("utf8"));
    console.log(Buffer.from(resJson["ok"], "base64").toString("utf8"));
  } catch (e: unknown) {
    console.error({ e });
  }
})();

export class GasInfo {
  public cost: bigint;
  public externallyUsed: bigint;

  constructor(cost: bigint, externallyUsed: bigint) {
    this.cost = cost;
    this.externallyUsed = externallyUsed;
  }

  public static withCost(amount: bigint): GasInfo {
    return {
      cost: amount,
      externallyUsed: 0n,
    };
  }

  public static withExternallyUsed(amount: bigint): GasInfo {
    return {
      cost: 0n,
      externallyUsed: amount,
    };
  }
}

export class Backend<
  A extends BackendApi,
  S extends Storage,
  Q extends Querier
> {
  public api: A;
  public storage: S;
  public querier: Q;

  constructor(api: A, storage: S, querier: Q) {
    this.api = api;
    this.storage = storage;
    this.querier = querier;
  }
}

export interface Storage {
  get: (key: Buffer) => Buffer;
  set: (key: Buffer, value: Buffer) => void;
  remove: (key: Buffer) => void;
}

export interface BackendApi {
  addrValidate: (input: string) => void;
  addrCanonicalize: (human: string) => Buffer;
  addrHumanize: (canonical: Buffer) => string;
}

export interface Querier {
  queryRaw: (request: Buffer) => Buffer;
}

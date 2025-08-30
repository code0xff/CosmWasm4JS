import { Env, MessageInfo } from "../std/index.js";
import { BackendApi, Storage, Querier } from "./backend.js";
import { Instance } from "./instance.js";
import { readRegion, writeRegion } from "./memory.js";

export const MI: number = 1024 * 1024;
export const RESULT_INSTANTIATE: number = 64 * MI;
export const RESULT_EXECUTE: number = 64 * MI;
export const RESULT_QUERY: number = 64 * MI;

export function callInstantiate<
  A extends BackendApi,
  S extends Storage,
  Q extends Querier
>(
  instance: Instance<A, S, Q>,
  env: Env,
  info: MessageInfo,
  msg: Buffer
): Buffer {
  return callInstantiateRaw<A, S, Q>(
    instance,
    Buffer.from(JSON.stringify(env), "utf8"),
    Buffer.from(JSON.stringify(info), "utf8"),
    msg
  );
}

export function callInstantiateRaw<
  A extends BackendApi,
  S extends Storage,
  Q extends Querier
>(instance: Instance<A, S, Q>, env: Buffer, info: Buffer, msg: Buffer): Buffer {
  return callRaw(instance, "instantiate", [env, info, msg], RESULT_INSTANTIATE);
}

export function callExecute<
  A extends BackendApi,
  S extends Storage,
  Q extends Querier
>(
  instance: Instance<A, S, Q>,
  env: Env,
  info: MessageInfo,
  msg: Buffer
): Buffer {
  return callExecuteRaw(
    instance,
    Buffer.from(JSON.stringify(env), "utf8"),
    Buffer.from(JSON.stringify(info), "utf8"),
    msg
  );
}

export function callExecuteRaw<
  A extends BackendApi,
  S extends Storage,
  Q extends Querier
>(instance: Instance<A, S, Q>, env: Buffer, info: Buffer, msg: Buffer): Buffer {
  return callRaw(instance, "execute", [env, info, msg], RESULT_EXECUTE);
}

export function callQuery<
  A extends BackendApi,
  S extends Storage,
  Q extends Querier
>(instance: Instance<A, S, Q>, env: Env, msg: Buffer): Buffer {
  return callQueryRaw(instance, Buffer.from(JSON.stringify(env), "utf8"), msg);
}

export function callQueryRaw<
  A extends BackendApi,
  S extends Storage,
  Q extends Querier
>(instance: Instance<A, S, Q>, env: Buffer, msg: Buffer): Buffer {
  return callRaw(instance, "query", [env, msg], RESULT_QUERY);
}

function callRaw<A extends BackendApi, S extends Storage, Q extends Querier>(
  instance: Instance<A, S, Q>,
  name: string,
  args: Buffer[],
  resultMaxLength: number
): Buffer {
  const argRegionPtrs: number[] = [];
  const { allocate, memory } = instance.inner.exports;
  for (const arg of args) {
    const regionPtr = (allocate as CallableFunction)(arg.length);
    writeRegion(memory as WebAssembly.Memory, regionPtr, arg);
    argRegionPtrs.push(regionPtr);
  }
  const resRegionPtr = (instance.inner.exports[name] as CallableFunction)(
    ...argRegionPtrs
  );
  const data = readRegion(
    memory as WebAssembly.Memory,
    resRegionPtr,
    resultMaxLength
  );
  const { deallocate } = instance.inner.exports;
  (deallocate as CallableFunction)(resRegionPtr);
  return data;
}

import { BackendError } from "./backend.js";

export class VmError implements Error {
  name: string;
  message: string;
  stack?: string;

  constructor(name: string, message: string) {
    this.name = name;
    this.message = message;
  }

  static aborted = (msg: string) => {
    return new VmError("Aborted", msg);
  };

  static backendErr = (source: BackendError) => {
    return new VmError("BackendErr", `Error calling into the VM's backend: ${source}`);
  };

  static gasDepletion = () => {
    return new VmError("GasDepletion", "Ran out of gas during contract execution");
  };

  static runtimeErr = (msg: string) => {
    return new VmError("RuntimeErr", `Error executing Wasm: ${msg}`);
  };
}

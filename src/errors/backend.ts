export class BackendError implements Error {
  name: string;
  message: string;
  stack?: string;

  constructor(name: string, message: string) {
    this.name = name;
    this.message = message;
  }

  static outOfGas = () => {
    return new BackendError("OutOfGas", "Ran out of gas during call into backend");
  };

  static userErr = (msg: string) => {
    return new BackendError("UserErr", `User error during call into backend: ${msg}`);
  };
}

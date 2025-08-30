export class CommunicationError implements Error {
  name: string;
  message: string;
  stack?: string;

  constructor(name: string, message: string) {
    this.name = name;
    this.message = message;
  }

  static zeroAddress = () => {
    return new CommunicationError("ZeroAddress", "Got a zero Wasm address");
  };

  static regionLengthTooBig = (length: number, maxLength: number) => {
    return new CommunicationError(
      "RegionLengthTooBig",
      `Region length too big. Got ${length}, limit ${maxLength}`
    );
  };
}

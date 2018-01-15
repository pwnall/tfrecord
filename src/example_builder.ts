import { tensorflow } from './gen/protos';

// Constructs a tfrecord.Example using the Builder pattern.
export class ExampleBuilder {
  // Opens a TFRecord file and creates a RecordWriter around it.
  public static create() : ExampleBuilder {
    return new ExampleBuilder();
  }

  // Creates an example with no features.
  public constructor() {
    this.features_ = {};
  }

  // Returns the built tfrecord.Example and reset the builder's state.
  public releaseExample(): tensorflow.Example {
    const returnValue = tensorflow.Example.fromObject(
        { features: { feature: this.features_ } });
    this.features_ = {};
    return returnValue;
  }

  // Creates an int64 feature with a single value.
  public setInteger(name : string, value : number) : void {
    this.features_[name] = { int64List: { value: [value] } };
  }

  // Creates an int64 feature with multiple values.
  public setIntegers(name : string, values : number[]) : void {
    this.features_[name] = { int64List: { value: values } };
  }

  // Creates a float feature with a single value.
  public setFloat(name : string, value : number) : void {
    this.features_[name] = { floatList: { value: [value] } };
  }

  // Creates a float feature with multiple values.
  public setFloats(name : string, values : number[]) : void {
    this.features_[name] = { floatList: { value: values } };
  }

  // Creates a byte feature with a single value.
  public setBinary(name : string, value : Uint8Array) : void {
    this.features_[name] = { bytesList: { value: [value] } };
  }

  // Creates a byte feature with multiple values.
  public setBinaries(name : string, values : Uint8Array[]) : void {
    this.features_[name] = { bytesList: { value: values } };
  }

  // TODO(pwnall): Reimplement the API using a more direct protobuf.js Example
  //               representation that minimizes the amount of computation in
  //               releaseExample().

  private features_ : { [name: string] : any };
}
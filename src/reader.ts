import * as fs from 'fs';
import { tensorflow } from './gen/protos';
import { RecordReader } from './record_reader';

// Reader for .tfrecord files containing TensorFlow training / prediction data.
export class Reader {
  // Opens a TFRecord file and creates a RecordWriter around it.
  public static async create(filePath : fs.PathLike) : Promise<Reader> {
    const recordReader = await RecordReader.create(filePath);
    return new Reader(recordReader);
  }

  // Reads a tensorflow.Example protocol buffer.
  //
  // Returns null when the end of the file is reached. Otherwise, returns a
  // tfrecord.Example, which is the result of compiling TensorFlow's
  // example.proto with protobuf.js.
  //
  // It is unsafe to call read() before the Promise returned by a previous
  // read() call resolves.
  public async readExample() : Promise<tensorflow.Example | null> {
    const record = await this.recordReader_.readRecord();
    if (record === null)
      return null;

    return tensorflow.Example.decode(record);
  }

  // Closes the reader.
  //
  // The reader is automatically closed when it reaches the end of the file.
  // Closing is idempotent.
  public async close(): Promise<void> {
    await this.recordReader_.close();
  }

  // Use Reader.create or tfrecord.createReader to obtain Reader instances.
  private constructor(recordReader : RecordReader) {
    this.recordReader_ = recordReader;
  }

  private recordReader_ : RecordReader;
}
import * as fs from 'fs';
import { tensorflow } from './gen/protos';
import { RecordWriter } from './record_writer';

// Reader for .tfrecord files containing TensorFlow training / prediction data.
export class Writer {
  // Opens a TFRecord file and creates a RecordWriter around it.
  public static async create(filePath : fs.PathLike) : Promise<Writer> {
    const recordReader = await RecordWriter.create(filePath);
    return new Writer(recordReader);
  }

  // Reads a tensorflow.Example protocol buffer.
  //
  // Returns null when the end of the file is reached. Otherwise, returns a
  // tfrecord.Example, which is the result of compiling TensorFlow's
  // example.proto with protobuf.js.
  //
  // It is unsafe to call read() before the Promise returned by a previous
  // read() call resolves.
  public async writeExample(example: tensorflow.Example) : Promise<void> {
    const record = tensorflow.Example.encode(example).finish() as Buffer;
    await this.recordWriter_.writeRecord(record);
  }

  // Closes the writer.
  //
  // Closing is idempotent.
  public async close(): Promise<void> {
    await this.recordWriter_.close();
  }

  // Use Writer.create or tfrecord.createWriter to obtain Writer instances.
  private constructor(recordWriter : RecordWriter) {
    this.recordWriter_ = recordWriter;
  }

  private recordWriter_ : RecordWriter;
}
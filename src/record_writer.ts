import * as fs from 'fs';
import { Writable } from 'stream';

import { maskedCrc32c } from './crc32c';

const aw = require('awaitify-stream');

export class RecordWriter {
  // Opens a TFRecord file and creates a RecordWriter around it.
  public static async create(filePath : fs.PathLike) : Promise<RecordWriter> {
    return this.createFromStream(fs.createWriteStream(filePath));
  }

  // Opens a TFRecord file stream and creates a RecordWriter around it.
  public static async createFromStream(stream : Writable) : Promise<RecordWriter> {
    return new RecordWriter(stream);
  }

  // Writes a record to a buffer.
  //
  // Uses a Buffer instead of an Uint8Array because that's what protobuf.js
  // writes to.
  public async writeRecord(record : Buffer) : Promise<void> {
    const metadataBuffer = new ArrayBuffer(12);
    const lengthAndCrcBuffer = new Uint8Array(metadataBuffer, 0, 12);
    const lengthAndCrc = new DataView(metadataBuffer, 0, 12);
    const lengthBuffer = Buffer.from(metadataBuffer, 0, 8);

    lengthAndCrc.setUint32(0, record.length, true);
    lengthAndCrc.setUint32(4, 0, true);
    lengthAndCrc.setUint32(8, maskedCrc32c(lengthBuffer), true);
    await this.writer_.writeAsync(lengthAndCrcBuffer);
    await this.writer_.writeAsync(record);

    const recordCrcBuffer = new Uint8Array(4);
    const recordCrc = new DataView(recordCrcBuffer.buffer, 0, 4);
    recordCrc.setUint32(0, maskedCrc32c(record), true);
    await this.writer_.writeAsync(recordCrcBuffer);
  }

  // RecordWriter instances should be created using RecordWriter.create.
  private constructor(stream : Writable) {
    this.stream_ = stream;
    this.writer_ = aw.createWriter(this.stream_);
    this.closed_ = false;
  }

  // Closes the writer.
  //
  // Closing is idempotent.
  public async close(): Promise<void> {
    if (this.closed_)
      return;

    this.closed_ = true;
    await this.writer_.endAsync();
  }

  // The file stream used to read records.
  private stream_ : Writable;
  // Awaitify-stream writer.
  private writer_ : any;
  // True when the reader is closed.
  private closed_ : boolean;
}

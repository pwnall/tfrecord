import * as fs from 'fs';
import { Readable } from 'stream';
import { maskedCrc32c } from './crc32c';

const aw = require('awaitify-stream');

export class RecordReader {
  // Opens a TFRecord file and creates a RecordReader around it.
  public static async create(filePath : fs.PathLike) : Promise<RecordReader> {
    return this.createFromStream(fs.createReadStream(filePath));
  }

  // Opens a TFRecord file stream and creates a RecordReader around it.
  public static async createFromStream(stream : Readable) : Promise<RecordReader> {
    return new RecordReader(stream);
  }

  // Reads a record from the file.
  //
  // Returns null when the end of the file is reached.
  //
  // The returned Uint8Array points to an internal buffer, and is only
  // guaranteed to be valid until the next readRecord() call.
  public async readRecord() : Promise<Uint8Array | null> {
    if (this.closed_)
      return null;

    const lengthAndCrcBuffer = await this.reader_.readAsync(12);
    if (lengthAndCrcBuffer === null)
      return null;

    const lengthBuffer = Buffer.from(lengthAndCrcBuffer.buffer, lengthAndCrcBuffer.byteOffset, 8);
    const lengthAndCrc = new DataView(lengthAndCrcBuffer.buffer, lengthAndCrcBuffer.byteOffset, 12);
    const length = lengthAndCrc.getUint32(0, true);
    const length64 = lengthAndCrc.getUint32(4, true);
    const lengthCrc = lengthAndCrc.getUint32(8, true);

    if (length64 !== 0)
      throw new Error(`4GB+ records not supported`);
    if (lengthCrc !== maskedCrc32c(lengthBuffer))
      throw new Error('Incorrect record length CRC32C');

    const readLength = length + 4;  // Need to read the CRC32C as well.
    const dataBuffer = await this.reader_.readAsync(readLength);
    if (dataBuffer === null) {
      throw new Error(`Incomplete read; expected ${readLength} bytes`);
    }

    const dataBufferView = new DataView(dataBuffer.buffer, dataBuffer.byteOffset, readLength);
    const recordData = new Uint8Array(dataBuffer.buffer, dataBuffer.byteOffset, length);
    const recordCrc = dataBufferView.getUint32(length, true);

    // TODO(pwnall): Check CRC.
    const recordBuffer = Buffer.from(dataBuffer.buffer as ArrayBuffer, dataBuffer.byteOffset, length);
    if (recordCrc !== maskedCrc32c(recordBuffer))
      throw new Error('Incorrect record CRC32C');

    return recordData;
  }

  // Closes the reader.
  //
  // The reader is automatically closed when it reaches the end of the file.
  // Closing is idempotent.
  public async close(): Promise<void> {
    if (this.closed_)
      return;

    this.closed_ = true;
    this.stream_.destroy();
  }

  // RecordReader instances should be created using RecordReader.create.
  private constructor(stream : Readable) {
    this.stream_ = stream;
    this.reader_ = aw.createReader(stream);
    this.closed_ = false;
  }

  // The file descriptor used to read records.
  private stream_ : Readable;
  // Awaitfy-stream reader.
  private reader_ : any;
  // True when the reader is closed.
  private closed_ : boolean;
}

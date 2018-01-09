import * as fs from 'fs';
import { promisify } from 'util';

import { maskedCrc32c } from './crc32c';

const fsOpen = promisify(fs.open);
const fsRead = promisify(fs.read);
const fsClose = promisify(fs.close);

export class RecordReader {
  // Opens a TFRecord file and creates a RecordReader around it.
  public static async create(filePath : fs.PathLike) : Promise<RecordReader> {
    const fd = await fsOpen(filePath, 'r');
    return new RecordReader(fd);
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

    let { bytesRead }  =
        await fsRead(this.fd_, this.lengthAndCrcBuffer_, 0, 12, null);
    if (bytesRead === 0)
      return null;
    if (bytesRead !== 12)
      throw new Error(`Incomplete read; expected 12 bytes, got ${bytesRead}`);

    const length = this.lengthAndCrc_.getUint32(0, true);
    const length64 = this.lengthAndCrc_.getUint32(4, true);
    const lengthCrc = this.lengthAndCrc_.getUint32(8, true);

    if (length64 !== 0)
      throw new Error(`4GB+ records not supported`);

    if (lengthCrc !== maskedCrc32c(this.lengthBuffer_))
      throw new Error('Incorrect record length CRC32C');

    const readLength = length + 4;  // Need to read the CRC32C as well.
    if (readLength > this.dataBuffer_.length) {
      // Grow the buffer.
      let newLength = this.dataBuffer_.length;
      while (newLength < readLength)
        newLength *= 2;
      this.dataBuffer_ = new Uint8Array(newLength);
      this.dataBufferView_ =
          new DataView(this.dataBuffer_.buffer, 0, newLength);
    }

    ({ bytesRead } =
        await fsRead(this.fd_, this.dataBuffer_, 0, readLength, null));
    if (bytesRead !== readLength) {
      throw new Error(
          `Incomplete read; expected ${readLength} bytes, got ${bytesRead}`);
    }

    const recordData = new Uint8Array(this.dataBuffer_.buffer, 0, length);
    const recordCrc = this.dataBufferView_.getUint32(length, true);

    // TODO(pwnall): Check CRC.
    const recordBuffer = Buffer.from(
        this.dataBuffer_.buffer as ArrayBuffer, 0, length);
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
    await fsClose(this.fd_);
  }

  // RecordReader instances should be created using RecordReader.create.
  private constructor(fd : number) {
    this.fd_ = fd;
    this.closed_ = false;

    this.dataBuffer_ = new Uint8Array(1);
    this.dataBufferView_ = new DataView(this.dataBuffer_.buffer, 0, 1);

    const metadataBuffer = new ArrayBuffer(12);
    this.lengthAndCrcBuffer_ = new Uint8Array(metadataBuffer, 0, 12);
    this.lengthAndCrc_ = new DataView(metadataBuffer, 0, 12);
    this.lengthBuffer_ = Buffer.from(metadataBuffer, 0, 8);
  }

  // The file descriptor used to read records.
  private fd_ : number;
  // True when the reader is closed.
  private closed_ : boolean;

  // Buffer used to read the 8-byte length and 4-byte CRC32C header.
  private lengthAndCrcBuffer_ : Uint8Array;
  // DataView used to extract the 8-byte length and 4-byte CRC32C header.
  private lengthAndCrc_ : DataView;
  // node.js Buffer pointing at length for CRC32C computations.
  private lengthBuffer_ : Buffer;

  // Buffer used to read records.
  private dataBuffer_ : Uint8Array;
  // DataVieww used to extract the 4-byte CRC32C at the end of the record.
  private dataBufferView_ : DataView;
}

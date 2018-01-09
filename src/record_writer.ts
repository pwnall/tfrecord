import * as fs from 'fs';
import { promisify } from 'util';

import { maskedCrc32c } from './crc32c';

const fsOpen = promisify(fs.open);
const fsWrite = promisify(fs.write);
const fsClose = promisify(fs.close);

export class RecordWriter {
  // Opens a TFRecord file and creates a RecordWriter around it.
  public static async create(filePath : fs.PathLike) : Promise<RecordWriter> {
    const fd = await fsOpen(filePath, 'w');
    return new RecordWriter(fd);
  }

  // Writes a record to a buffer.
  //
  // Uses a Buffer instead of an Uint8Array because that's what protobuf.js
  // writes to.
  public async writeRecord(record : Buffer) : Promise<void> {
    const length = record.length;
    this.lengthAndCrc_.setUint32(0, length, true);

    const lengthCrc = maskedCrc32c(this.lengthBuffer_);
    this.lengthAndCrc_.setUint32(8, lengthCrc, true);

    let { bytesWritten } =
        await fsWrite(this.fd_, this.lengthAndCrcBuffer_, 0, 12, null);
    if (bytesWritten != 12)
      throw new Error(`Incomplete write; had 12 bytes, wrote ${bytesWritten}`);

    ({ bytesWritten } = await fsWrite(this.fd_, record, 0, length, null));
    if (bytesWritten != length) {
      throw new Error(
          `Incomplete write; had ${length} bytes, wrote ${bytesWritten}`);
    }

    const recordCrc = maskedCrc32c(record);
    this.lengthAndCrc_.setUint32(0, recordCrc, true);
    ({ bytesWritten } =
        await fsWrite(this.fd_, this.lengthAndCrcBuffer_, 0, 4, null));
    if (bytesWritten != 4)
      throw new Error(`Incomplete write; had 4 bytes, wrote ${bytesWritten}`);
  }

  // RecordWriter instances should be created using RecordWriter.create.
  private constructor(fd : number) {
    this.fd_ = fd;
    this.closed_ = false;

    const metadataBuffer = new ArrayBuffer(12);
    this.lengthAndCrcBuffer_ = new Uint8Array(metadataBuffer, 0, 12);
    this.lengthAndCrc_ = new DataView(metadataBuffer, 0, 12);
    this.lengthBuffer_ = Buffer.from(metadataBuffer, 0, 8);

    // The high-order bits of length will alwas be unset.
    this.lengthAndCrc_.setUint32(4, 0, true);
  }

  // Closes the writer.
  //
  // Closing is idempotent.
  public async close(): Promise<void> {
    if (this.closed_)
      return;

    this.closed_ = true;
    await fsClose(this.fd_);
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
}
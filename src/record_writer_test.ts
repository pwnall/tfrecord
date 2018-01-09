import * as tfrecord from './index';

import * as fs from 'fs';
import { promisify } from 'util';

import { expect } from 'chai';

// Workaround the fact that @types/promised-temp has incorrect typings.
const temp : any = require('promised-temp');

// Passed to promised-temp to generate temporary files.
const tempAffixes = { prefix: 'node-tfrecord', suffix: '.tfrecord' };
const fsClose = promisify(fs.close);

// Creates a temporary file.
async function createTempFile() : Promise<string> {
  const { path, fd } = await temp.open(tempAffixes);
  await fsClose(fd);

  return path;
}

describe('RecordWriter', () => {
  beforeEach(async () => {
    await temp.track();
  });
  afterEach(async () => {
    await temp.cleanup();
  });

  describe('.create', () => {
    it('produces a RecordWriter when given a valid path', async () => {
      const filePath = await createTempFile();
      const writer = await tfrecord.RecordWriter.create(filePath);
      expect(writer).to.be.instanceOf(tfrecord.RecordWriter);

      writer.close();
    });
  });

  describe('.writeRecord', () => {
    let filePath : string, writer : tfrecord.RecordWriter;
    beforeEach(async () => {
      filePath = await createTempFile();
      writer = await tfrecord.RecordWriter.create(filePath);
    });

    it('creates a correct file with one record', async () => {
      const recordData : number[] = [];
      for (let i = 0; i < 1000; ++i)
        recordData.push((i + 42) % 256);
      await writer.writeRecord(Buffer.from(recordData));
      writer.close();

      const reader = await tfrecord.RecordReader.create(filePath);
      const readRecord = await reader.readRecord();
      expect(readRecord).not.to.equal(null);
      expect(Array.from(readRecord as Uint8Array)).to.deep.equal(recordData);

      expect(await reader.readRecord()).to.equal(null);
    });

    it('creates a correct file with three records', async () => {
      const recordsData : number[][] = [];
      for (let i = 0; i < 3; ++i) {
        const recordData : number[] = [];
        recordsData.push(recordData);
        for (let j = 0; j < i * 100; ++j)
          recordData.push((j + i + 42) % 256);

        await writer.writeRecord(Buffer.from(recordData));
      }
      writer.close();

      const reader = await tfrecord.RecordReader.create(filePath);
      for (let i = 0; i < 3; ++i) {
        const readRecord = await reader.readRecord();
        expect(readRecord).not.to.equal(null);
        expect(Array.from(readRecord as Uint8Array)).to.deep.equal(
            recordsData[i]);
      }

      expect(await reader.readRecord()).to.equal(null);
    });
  });
});
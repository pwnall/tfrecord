import * as tfrecord from './index';

import { expect } from 'chai';

const filePath = 'testdata/singles.tfrecords';

describe('RecordReader', () => {
  describe('.create', () => {
    it('produces a RecordReader when given a valid path', async () => {
      const reader = await tfrecord.RecordReader.create(filePath);
      expect(reader).to.be.instanceOf(tfrecord.RecordReader);

      reader.close();
    });
  });

  describe('with singles.tfrecord', () => {
    let reader : tfrecord.RecordReader;
    beforeEach(async () => {
      reader = await tfrecord.RecordReader.create(filePath);
    });
    afterEach(async () => { await reader.close(); });

    it('reads a record without crashing', async () => {
      const record = await reader.readRecord();
      expect(record).to.be.instanceOf(Uint8Array);
    });

    it('reads a record with correct data', async () => {
      const record : Uint8Array = await reader.readRecord() as Uint8Array;
      expect(record).to.be.instanceOf(Uint8Array);

      const example = tfrecord.Example.decode(record);
      expect(example).not.to.equal(null);
      expect(example.features).not.to.equal(null);

      const feature = example.features!.feature!;
      expect(feature).not.to.equal(null);
      expect(feature).to.haveOwnProperty('int_feature');

      expect(feature.int_feature).to.haveOwnProperty('int64List');
      expect(feature.int_feature.int64List).not.to.equal(null);
      expect(feature.int_feature.int64List!.value!.length).to.equal(1);

      const value = feature.int_feature.int64List!.value![0] as Long;
      expect(value.toNumber()).to.equal(42);
    });

    it('it reads 3 records and then ends-of-file', async () => {
      const record1 = await reader.readRecord() as Uint8Array;
      expect(record1).to.be.instanceOf(Uint8Array);

      const record2 = await reader.readRecord() as Uint8Array;
      expect(record2).to.be.instanceOf(Uint8Array);

      const record3 = await reader.readRecord() as Uint8Array;
      expect(record3).to.be.instanceOf(Uint8Array);

      const example3 = tfrecord.Example.decode(record3);
      expect(example3).not.to.equal(null);
      expect(example3).to.be.instanceOf(tfrecord.Example);
      expect(example3.features).not.to.equal(null);

      const feature3 = example3.features!.feature!;
      expect(feature3).not.to.equal(null);
      expect(feature3).to.haveOwnProperty('byte_feature');
      expect(feature3.byte_feature).to.haveOwnProperty('bytesList');
      expect(feature3.byte_feature.bytesList).not.to.equal(null);
      expect(feature3.byte_feature!.bytesList!.value!.length).to.equal(1);

      const value3 = feature3.byte_feature!.bytesList!.value![0];
      expect(Array.from(value3)).to.deep.equal([64, 65, 66, 67, 68]);

      const record4 = await reader.readRecord();
      expect(record4).to.equal(null);
    });
  });
});
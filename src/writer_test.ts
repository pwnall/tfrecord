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

describe('Writer', () => {
  beforeEach(async () => {
    await temp.track();
  });
  afterEach(async () => {
    await temp.cleanup();
  });

  describe('.create', () => {
    it('produces a Writer when given a valid path', async () => {
      const filePath = await createTempFile();
      const writer = await tfrecord.Writer.create(filePath);
      expect(writer).to.be.instanceOf(tfrecord.Writer);

      writer.close();
    });
  });

  describe('.writeExample', () => {
    let filePath : string, writer : tfrecord.Writer;
    beforeEach(async () => {
      filePath = await createTempFile();
      writer = await tfrecord.Writer.create(filePath);
    });

    it('creates a correct file with one example', async() => {
      const examplePayload = {
        features: {
          feature: {
            int_feature: {
              int64List: {
                value: [42],
              },
            },
          },
        },
      };
      expect(tfrecord.Example.verify(examplePayload)).to.equal(null);
      const exampleData = tfrecord.Example.fromObject(examplePayload);
      await writer.writeExample(exampleData);
      await writer.close();

      const reader = await tfrecord.Reader.create(filePath);
      const example = await reader.readExample() as tfrecord.Example;

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

      await reader.close();
    });

    it('creates a correct file with three examples', async() => {
      const example1Payload = {
        features: {
          feature: {
            int_feature: {
              int64List: {
                value: [42],
              },
            },
          },
        },
      };
      expect(tfrecord.Example.verify(example1Payload)).to.equal(null);
      const example1Data = tfrecord.Example.fromObject(example1Payload);
      await writer.writeExample(example1Data);

      const example2Payload = {
        features: {
          feature: {
            float_feature: {
              floatList: {
                value: [3.14],
              },
            },
          },
        },
      };
      expect(tfrecord.Example.verify(example2Payload)).to.equal(null);
      const example2Data = tfrecord.Example.fromObject(example2Payload);
      await writer.writeExample(example2Data);

      const example3Payload = {
        features: {
          feature: {
            byte_feature: {
              bytesList: {
                value: [new Uint8Array([64, 65, 66, 67, 68])],
              },
            },
          },
        },
      };
      expect(tfrecord.Example.verify(example3Payload)).to.equal(null);
      const example3Data = tfrecord.Example.fromObject(example3Payload);
      await writer.writeExample(example3Data);
      await writer.close();

      const reader = await tfrecord.Reader.create(filePath);

      const example1 = await reader.readExample() as tfrecord.Example;
      expect(example1).not.to.equal(null);
      expect(example1).to.be.instanceOf(tfrecord.Example);

      const feature1 = example1.features!.feature!;
      expect(feature1.int_feature).to.haveOwnProperty('int64List');
      expect(feature1.int_feature!.int64List!.value!.length).to.equal(1);

      const value1 = feature1.int_feature!.int64List!.value![0] as Long;
      expect(value1.toNumber()).to.equal(42);

      const example2 = await reader.readExample() as tfrecord.Example;
      expect(example2).not.to.equal(null);
      expect(example2).to.be.instanceOf(tfrecord.Example);
      expect(example2.features).not.to.equal(null);

      const feature2 = example2.features!.feature!;
      expect(feature2).not.to.equal(null);
      expect(feature2).to.haveOwnProperty('float_feature');
      expect(feature2.float_feature).to.haveOwnProperty('floatList');
      expect(feature2.float_feature!.floatList!.value!.length).to.equal(1);

      const value2 = feature2.float_feature!.floatList!.value![0];
      expect(value2).to.be.closeTo(3.14, 0.00001);

      const example3 = await reader.readExample() as tfrecord.Example;
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

      const example4 = await reader.readExample();
      expect(example4).to.equal(null);

      await reader.close();
    });
  });
});
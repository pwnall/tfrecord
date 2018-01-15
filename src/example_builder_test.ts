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

describe('ExampleBuilder', () => {
  beforeEach(async () => {
    await temp.track();
  });
  afterEach(async () => {
    await temp.cleanup();
  });

  describe('.constructor', () => {
    it('produces an ExampleBuilder', async () => {
      const builder = new tfrecord.ExampleBuilder();
      expect(builder).to.be.instanceOf(tfrecord.ExampleBuilder);
    });
  });

  describe('.create', () => {
    it('produces an ExampleBuilder', async () => {
      const builder = tfrecord.ExampleBuilder.create();
      expect(builder).to.be.instanceOf(tfrecord.ExampleBuilder);
    });
  });

  describe('.releaseExample', () => {
    let builder : tfrecord.ExampleBuilder;
    let filePath : string, writer : tfrecord.Writer;
    beforeEach(async () => {
      builder = new tfrecord.ExampleBuilder();
      filePath = await createTempFile();
      writer = await tfrecord.Writer.create(filePath);
    });

    it('creates a correct Example with an int64 feature', async() => {
      builder.setInteger('int_feature', 42);
      const exampleData = builder.releaseExample();
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

    it('creates a correct Example with a float feature', async() => {
      builder.setFloat('float_feature', 3.14);
      const exampleData = builder.releaseExample();
      await writer.writeExample(exampleData);
      await writer.close();

      const reader = await tfrecord.Reader.create(filePath);
      const example = await reader.readExample() as tfrecord.Example;

      expect(example).not.to.equal(null);
      expect(example.features).not.to.equal(null);

      const feature = example.features!.feature!;
      expect(feature).not.to.equal(null);
      expect(feature).to.haveOwnProperty('float_feature');

      expect(feature.float_feature).to.haveOwnProperty('floatList');
      expect(feature.float_feature!.floatList!.value!.length).to.equal(1);

      const value = feature.float_feature!.floatList!.value![0];
      expect(value).to.be.closeTo(3.14, 0.00001);

      await reader.close();
    });

    it('creates a correct Example with a binary feature', async() => {
      builder.setBinary('byte_feature', new Uint8Array([64, 65, 66, 67, 68]));
      const exampleData = builder.releaseExample();
      await writer.writeExample(exampleData);
      await writer.close();

      const reader = await tfrecord.Reader.create(filePath);
      const example = await reader.readExample() as tfrecord.Example;

      expect(example).not.to.equal(null);
      expect(example.features).not.to.equal(null);

      const feature = example.features!.feature!;
      expect(feature).to.haveOwnProperty('byte_feature');
      expect(feature.byte_feature).to.haveOwnProperty('bytesList');
      expect(feature.byte_feature.bytesList).not.to.equal(null);
      expect(feature.byte_feature!.bytesList!.value!.length).to.equal(1);

      const value = feature.byte_feature!.bytesList!.value![0];
      expect(Array.from(value)).to.deep.equal([64, 65, 66, 67, 68]);

      await reader.close();
    });
  });
});
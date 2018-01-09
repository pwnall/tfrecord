import * as tfrecord from './index';

import { expect } from 'chai';

const filePath = 'testdata/singles.tfrecords';

describe('Reader', () => {
  describe('.create', () => {
    it('produces a Reader when given a valid path', async () => {
      const reader = await tfrecord.Reader.create(filePath);
      expect(reader).to.be.instanceOf(tfrecord.Reader);

      reader.close();
    });
  });

  describe('with singles.tfrecord', () => {
    let reader : tfrecord.Reader;
    beforeEach(async () => {
      reader = await tfrecord.Reader.create(filePath);
    });
    afterEach(async () => { await reader.close(); });

    it('reads an example without crashing', async () => {
      const example = await reader.readExample();
      expect(example).to.be.instanceOf(tfrecord.Example);
    });

    it('reads an example with correct data', async () => {
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
    });

    it('it reads 3 examples and then ends-of-file', async () => {
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
    });
  });
});
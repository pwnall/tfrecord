# TensorFlow record (.tfrecord) File I/O for Node

[![Build Status](https://travis-ci.org/wholenews/tfrecord-stream.svg)](https://travis-ci.org/wholenews/tfrecord-stream)
[![NPM Version](http://img.shields.io/npm/v/tfrecord-stream.svg)](https://www.npmjs.org/package/tfrecord-stream)

The TFRecord format is briefly documented
[here](https://www.tensorflow.org/api_guides/python/python_io#tfrecords_format_details),
and described as the recommended format for feeding data into TenosorFlow
[here](https://www.tensorflow.org/api_guides/python/reading_data#standard_tensorflow_format)
and
[here](https://www.tensorflow.org/api_guides/python/io_ops#example_protocol_buffer).

This library facilitates producing data in the TFRecord format directly in
node.js. The library is not "official" - it is not part of TensorFlow, and it is
not maintained by the TensorFlow team.


## Requirements

This module uses
[ES2017's async / await](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function),
so it requires node.js 7.6 or above.

While this module will presumably be used to interoperate with
[TensorFlow](https://www.tensorflow.org/), it does not require a working
TensorFlow installation.


## Usage

The example below covers recommended API usage.

```javascript
import { Reader, Writer } from 'tfrecord'

async function writeDemo() {
  const builder = tfrecord.createBuilder();
  builder.setInteger('answer', 42);
  builder.setFloat('pi', 3.14);
  builder.setBinary('name', new Uint8Array([65, 66, 67]));
  const example = builder.releaseExample();

  const writer = await Writer.createFromStream(fs.createWriteStream('data.tfrecord'));
  await writer.writeExample(example);
  await writer.close();
}

async function readDemo() {
  const reader = await Reader.createFromStream(fs.createReadStream('data.tfrecord'));
  let example;
  while (example = await reader.readExample()) {
    console.log('%j', example.toJSON());
  }
  // The reader auto-closes after it reaches the end of the file.
}

async function demo() {
  await writeDemo();
  await readDemo();
}

let _ = demo();
```

The module also exposes the following low-level APIs:

* `tfrecord.RecordReader`, `tfrecord.RecordWriter` - read/write files in the
  TensorFlow-flavored RecordIO format
* `tfrecord.Example` - TensorFlow's Example protobuf, as compiled by
  [protobuf.js](https://github.com/dcodeIO/protobuf.js)
* `tfrecord.protos` - the classes generated by compiling TensorFlow's protobuf
  definitions

The low-level APIs are exposed to make it easier to start working on an
advanced use cases. While no current plan involves breaking these APIs, they
might break more often than the high-level APIs.


## Development

Run the following command to populate the pre-generated files. These files are
distributed in the npm package, but not checked into the git repository.

```bash
scripts/generate.sh
```

The test data can be regenerated by the following command, which requires a
working TensorFlow installation on Python 3.

```bash
python3 scripts/write_test_data.py
```

The test data is in the repository so we don't have to spend the time to install TensorFlow on Travis for every run.

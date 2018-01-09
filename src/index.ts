// We expose all protobuf.js types, in case someone needs them.
//
// However, they're not part of the stable API, so do not take a dependency on
// them lightly.
export { tensorflow as protos } from './gen/protos';

import { tensorflow } from './gen/protos';
export const Example = tensorflow.Example;
export type Example = tensorflow.Example;

import { Reader } from './reader';
import { RecordReader } from './record_reader';
import { RecordWriter } from './record_writer';
import { Writer } from './writer';
export { Reader, RecordReader, RecordWriter, Writer };

export const createReader = Reader.create;
export const createWriter = Writer.create;
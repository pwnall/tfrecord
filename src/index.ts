// We expose all protobuf.js types, in case someone needs them.
//
// However, they're not part of the stable API, so do not take a dependency on
// them lightly.
export { tensorflow as protos } from './gen/protos';

import { tensorflow } from './gen/protos';
export const Example = tensorflow.Example;
export type Example = tensorflow.Example;

import { ExampleBuilder } from './example_builder';
import { Reader } from './reader';
import { RecordReader } from './record_reader';
import { RecordWriter } from './record_writer';
import { Writer } from './writer';
export { ExampleBuilder, Reader, RecordReader, RecordWriter, Writer };

export const createBuilder = ExampleBuilder.create;
export const createReader = Reader.create;
export const createWriter = Writer.create;
#!/usr/bin/python3

"""
Outputs test data for node-tfrecord.
"""

import tensorflow as tf

def main():
    """
    Outputs test data for node-tfrecord.
    """

    # Records with a single feature.
    with tf.python_io.TFRecordWriter('testdata/singles.tfrecords') as writer:
        example = tf.train.Example(features=tf.train.Features(feature={
            'int_feature': tf.train.Feature(int64_list=tf.train.Int64List(
                value=[42])),
        }))
        writer.write(example.SerializeToString())

        example = tf.train.Example(features=tf.train.Features(feature={
            'float_feature': tf.train.Feature(float_list=tf.train.FloatList(
                value=[3.14])),
        }))
        writer.write(example.SerializeToString())

        example = tf.train.Example(features=tf.train.Features(feature={
            'byte_feature': tf.train.Feature(bytes_list=tf.train.BytesList(
                value=[bytes([64, 65, 66, 67, 68])])),
        }))
        writer.write(example.SerializeToString())

    # Records with a feature that is a list of items.

main()

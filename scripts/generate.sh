#! /bin/sh

# Download the protobuf definitions from the TensorFlow repository.
TF_VERSION="v1.4.1"
TF_ROOT="https://raw.githubusercontent.com/tensorflow/tensorflow/${TF_VERSION}/"
mkdir -p proto/
if [ ! -f  proto/example.proto ]; then
  curl "${TF_ROOT}/tensorflow/core/example/example.proto" > proto/example.proto
fi
if [ ! -f proto/feature.proto ]; then
  curl "${TF_ROOT}/tensorflow/core/example/feature.proto" > proto/feature.proto
fi

# Compile the protobufs into src/gen.
#
# The compilers bundled with protobuf.js create an ES6 JavaScript file and a
# TypeScript definitions file. Unfortunately, direct TypeScript output does not
# seem to be available.
mkdir -p src/gen/
mkdir -p lib/gen/
if [ ! -f lib/gen/protos.js ]; then
./node_modules/.bin/pbjs --target static-module --wrap commonjs \
    --out lib/gen/protos.js proto/example.proto proto/feature.proto
fi
if [ ! -f src/gen/protos.d.ts ]; then
  ./node_modules/.bin/pbts --out src/gen/protos.d.ts lib/gen/protos.js
fi
if [ ! -f lib/gen/protos.d.ts ]; then
  ./node_modules/.bin/pbts --out lib/gen/protos.d.ts lib/gen/protos.js
fi
import test from 'node:test';
import assert from 'node:assert/strict';
import zlib from 'node:zlib';
import { makeZip, readZip, isZip, crc32 } from '../shared/zip.js';

const enc = new TextEncoder();
const dec = new TextDecoder();

test('crc32 matches the standard check value', () => {
  assert.equal(crc32(enc.encode('123456789')), 0xcbf43926);
});

test('a zip made here reads back, with names in UTF-8 and binary data intact', async () => {
  const binary = Uint8Array.from({ length: 1000 }, (_, i) => (i * 7) % 256);
  const zip = makeZip([{ name: 'backup.json', data: enc.encode('{"a":1}') }, { name: 'files/set one/images/é.png', data: binary }, { name: 'empty.txt', data: new Uint8Array(0) }]);
  assert.ok(isZip(zip));
  const files = readZip(zip);
  assert.deepEqual([...files.keys()], ['backup.json', 'files/set one/images/é.png', 'empty.txt']);
  assert.equal(dec.decode(await files.get('backup.json')()), '{"a":1}');
  assert.deepEqual([...(await files.get('files/set one/images/é.png')())], [...binary]);
  assert.equal((await files.get('empty.txt')()).length, 0);
});

test('a zip made by another tool (deflated) reads too, and Python-style stored zips are accepted by the real unzip rules', async () => {
  // build one deflated entry by hand around zlib's raw deflate
  const text = enc.encode('hello hello hello hello hello');
  const body = zlib.deflateRawSync(text);
  const name = enc.encode('a.txt');
  const local = Buffer.alloc(30);
  local.writeUInt32LE(0x04034b50, 0); local.writeUInt16LE(20, 4); local.writeUInt16LE(8, 8);
  local.writeUInt32LE(crc32(text), 14); local.writeUInt32LE(body.length, 18); local.writeUInt32LE(text.length, 22); local.writeUInt16LE(name.length, 26);
  const head = Buffer.alloc(46);
  head.writeUInt32LE(0x02014b50, 0); head.writeUInt16LE(20, 4); head.writeUInt16LE(20, 6); head.writeUInt16LE(8, 10);
  head.writeUInt32LE(crc32(text), 16); head.writeUInt32LE(body.length, 20); head.writeUInt32LE(text.length, 24); head.writeUInt16LE(name.length, 28); head.writeUInt32LE(0, 42);
  const end = Buffer.alloc(22);
  const centralAt = 30 + name.length + body.length;
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(1, 8); end.writeUInt16LE(1, 10); end.writeUInt32LE(46 + name.length, 12); end.writeUInt32LE(centralAt, 16);
  const zip = new Uint8Array(Buffer.concat([local, Buffer.from(name), body, head, Buffer.from(name), end]));
  assert.equal(dec.decode(await readZip(zip).get('a.txt')()), 'hello hello hello hello hello');
});

test('something that is not a zip is refused', () => {
  assert.equal(isZip(enc.encode('{"format":1}')), false);
  assert.throws(() => readZip(enc.encode('not a zip at all, just some text that is long enough')), /not a readable zip/);
});

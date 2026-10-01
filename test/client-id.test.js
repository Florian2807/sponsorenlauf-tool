import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createClientId } from '../src/utils/clientId.js';

test('client IDs work when randomUUID is unavailable on an HTTP origin', () => {
  let counter = 0;
  const cryptoSource = {
    getRandomValues(bytes) {
      bytes.fill(counter++);
      return bytes;
    },
  };
  const first = createClientId('manual', cryptoSource);
  const second = createClientId('manual', cryptoSource);

  assert.match(first, /^manual_[a-f0-9]{32}$/);
  assert.notEqual(first, second);
  assert.match(createClientId('scan', cryptoSource), /^scan_[a-f0-9]{32}$/);
});

test('client IDs still match the API format if Web Crypto is unavailable', () => {
  assert.match(createClientId('manual', null), /^manual_[a-zA-Z0-9_-]{8,100}$/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { helpFaq } from '../src/content/helpFaq.js';
import { filterFaq } from '../../frontend/src/utils/searchFaq.js';

test('FAQ content is complete and questions are unique', () => {
  const questions = helpFaq.flatMap((group) => group.items.map((item) => item.q));

  assert.equal(helpFaq.length, 6);
  assert.equal(questions.length, 33);
  assert.equal(new Set(questions).size, questions.length);
  for (const group of helpFaq) {
    assert.ok(group.description);
    assert.ok(group.items.every((item) => item.q.length > 10 && item.a.length > 40));
  }
});
test('FAQ search handles accents, multiple words, filters and empty results', () => {
  const search = (query, category) =>
    filterFaq(helpFaq, query, category).flatMap((group) => group.items);

  assert.equal(search('').length, 33);
  assert.ok(search('inscricao').length > 0);
  assert.deepEqual(search('  SIMULACAO  '), search('simulação'));
  assert.ok(search('pagamento recusado').some((item) => item.q.includes('recusado')));
  assert.equal(search('', 'Conta e privacidade').length, 5);
  assert.equal(search('termoimpossivel').length, 0);
  assert.equal(search('certificado', 'Conta e privacidade').length, 0);
});

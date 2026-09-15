import { readFileSync } from 'node:fs';

const en = readFileSync('web/src/i18n/locales/en/citizenAck.json', 'utf8');
const bn = readFileSync('web/src/i18n/locales/bn/citizenAck.json', 'utf8');
const re = /[\u0904-\u0939\u0958-\u0961\u0971-\u097F]/;
console.log('EN Hindi match:', re.test(en));
console.log('BN Hindi match:', re.test(bn));

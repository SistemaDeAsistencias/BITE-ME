const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('existe la migración principal con tablas críticas', () => {
  const sql = fs.readFileSync(path.join(__dirname, '../src/db/migrations/001_init.sql'), 'utf8');
  for (const table of ['users','categories','products','orders','order_items','payments','order_status_history','newsletter_subscribers']) {
    assert.match(sql, new RegExp(`CREATE TABLE IF NOT EXISTS ${table}\\s*\\(`, 'i'), `falta tabla ${table}`);
  }
});
test('la API define validación de stock y transacciones de pedidos', () => {
  const app = fs.readFileSync(path.join(__dirname, '../src/app.js'), 'utf8');
  assert.match(app, /BEGIN/);
  assert.match(app, /ROLLBACK/);
  assert.match(app, /Stock insuficiente/);
  assert.match(app, /requireAdmin/);
});
test('los recursos principales de la tienda están presentes', () => {
  for (const file of ['index.html','styles.css','app.js']) assert.ok(fs.existsSync(path.join(__dirname, '../public', file)), `falta ${file}`);
});

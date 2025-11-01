const NoSQLite = require('./NosqLite');
const fs = require('fs');
const path = require('path');

// Helper function for colored output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function test(name, fn) {
  try {
    fn();
    log(`✅ ${name}`, 'green');
    return true;
  } catch (error) {
    log(`❌ ${name}: ${error.message}`, 'red');
    console.error(error);
    return false;
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

function assertEqual(actual, expected, message) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(message || `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function assertDeepEqual(actual, expected, message) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(message || `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

// Initialize database
log('🚀 Initializing NoSQLite Database Tests...\n', 'cyan');
const db = new NoSQLite('./test_db');

// Clean up test database before starting
const testDbPath = path.resolve('./test_db');
if (fs.existsSync(testDbPath)) {
  const files = fs.readdirSync(testDbPath);
  files.forEach(file => {
    fs.unlinkSync(path.join(testDbPath, file));
  });
  fs.rmdirSync(testDbPath);
}

// Reinitialize database
const db2 = new NoSQLite('./test_db');

log('\n📋 Running Tests...\n', 'blue');

let passedTests = 0;
let totalTests = 0;

// Test 1: Database Initialization
totalTests++;
test('Database initialization', () => {
  const testDb = new NoSQLite('./test_db');
  assert(testDb !== null, 'Database should be initialized');
  assert(testDb.getDbPath() !== undefined, 'Database path should be set');
  passedTests++;
});

// Test 2: Collection Creation
totalTests++;
test('Collection creation', () => {
  const users = db2.collection('users');
  assert(users !== null, 'Collection should be created');
  assert(users.name === 'users', 'Collection name should match');
  passedTests++;
});

// Test 3: Insert Single Document
totalTests++;
test('Insert single document', () => {
  const users = db2.collection('users');
  const doc = { name: 'John Doe', age: 30, email: 'john@example.com' };
  const inserted = users.insert(doc);
  assert(inserted._id !== undefined, 'Document should have _id');
  assert(inserted.name === 'John Doe', 'Document should have correct name');
  assert(inserted._createdAt !== undefined, 'Document should have _createdAt');
  assert(inserted._updatedAt !== undefined, 'Document should have _updatedAt');
  passedTests++;
});

// Test 4: Insert Multiple Documents
totalTests++;
test('Insert multiple documents', () => {
  const users = db2.collection('users');
  const docs = [
    { name: 'Jane Smith', age: 25, email: 'jane@example.com' },
    { name: 'Bob Johnson', age: 35, email: 'bob@example.com' }
  ];
  const inserted = users.insert(docs);
  assert(Array.isArray(inserted), 'Should return array');
  assert(inserted.length === 2, 'Should insert 2 documents');
  assert(inserted[0]._id !== undefined, 'First document should have _id');
  assert(inserted[1]._id !== undefined, 'Second document should have _id');
  passedTests++;
});

// Test 5: Find All Documents
totalTests++;
test('Find all documents', () => {
  const users = db2.collection('users');
  const results = users.find();
  assert(results.length >= 3, 'Should find at least 3 documents');
  passedTests++;
});

// Test 6: Find with Query
totalTests++;
test('Find with simple query', () => {
  const users = db2.collection('users');
  const results = users.find({ name: 'John Doe' });
  assert(results.length >= 1, 'Should find John Doe');
  assert(results[0].name === 'John Doe', 'Result should match query');
  passedTests++;
});

// Test 7: FindOne
totalTests++;
test('FindOne operation', () => {
  const users = db2.collection('users');
  const result = users.findOne({ name: 'Jane Smith' });
  assert(result !== null, 'Should find one document');
  assert(result.name === 'Jane Smith', 'Result should match');
  
  const notFound = users.findOne({ name: 'Nonexistent' });
  assert(notFound === null, 'Should return null for non-existent document');
  passedTests++;
});

// Test 8: Update with $set
totalTests++;
test('Update with $set operator', () => {
  const users = db2.collection('users');
  const result = users.update(
    { name: 'John Doe' },
    { $set: { age: 31, city: 'New York' } }
  );
  assert(result.modifiedCount >= 1, 'Should update at least 1 document');
  
  const updated = users.findOne({ name: 'John Doe' });
  assert(updated.age === 31, 'Age should be updated');
  assert(updated.city === 'New York', 'City should be added');
  passedTests++;
});

// Test 9: Update with $inc
totalTests++;
test('Update with $inc operator', () => {
  const users = db2.collection('users');
  const before = users.findOne({ name: 'Jane Smith' });
  const beforeAge = before.age;
  
  const result = users.update(
    { name: 'Jane Smith' },
    { $inc: { age: 1 } }
  );
  assert(result.modifiedCount >= 1, 'Should update document');
  
  const after = users.findOne({ name: 'Jane Smith' });
  assert(after.age === beforeAge + 1, 'Age should be incremented');
  passedTests++;
});

// Test 10: Update with $unset
totalTests++;
test('Update with $unset operator', () => {
  const users = db2.collection('users');
  // First ensure a field exists
  users.update(
    { name: 'Bob Johnson' },
    { $set: { status: 'active', city: 'Boston' } }
  );
  
  const before = users.findOne({ name: 'Bob Johnson' });
  assert(before.status === 'active', 'Status should exist before unset');
  assert(before.city === 'Boston', 'City should exist before unset');
  
  // Unset a field (note: $unset expects array in this implementation)
  users.update(
    { name: 'Bob Johnson' },
    { $unset: ['status'] }
  );
  
  const after = users.findOne({ name: 'Bob Johnson' });
  assert(after.status === undefined, 'Status should be removed');
  assert(after.city === 'Boston', 'City should still exist');
  passedTests++;
});

// Test 11: Update with direct assignment
totalTests++;
test('Update with direct assignment', () => {
  const users = db2.collection('users');
  users.update(
    { name: 'Bob Johnson' },
    { age: 36, status: 'active' }
  );
  
  const updated = users.findOne({ name: 'Bob Johnson' });
  assert(updated.age === 36, 'Age should be updated');
  assert(updated.status === 'active', 'Status should be set');
  passedTests++;
});

// Test 12: Query with $gt
totalTests++;
test('Query with $gt operator', () => {
  const users = db2.collection('users');
  const results = users.find({ age: { $gt: 30 } });
  assert(results.length >= 1, 'Should find documents with age > 30');
  results.forEach(doc => {
    assert(doc.age > 30, 'All results should have age > 30');
  });
  passedTests++;
});

// Test 13: Query with $lt
totalTests++;
test('Query with $lt operator', () => {
  const users = db2.collection('users');
  const results = users.find({ age: { $lt: 30 } });
  results.forEach(doc => {
    assert(doc.age < 30, 'All results should have age < 30');
  });
  passedTests++;
});

// Test 14: Query with $gte
totalTests++;
test('Query with $gte operator', () => {
  const users = db2.collection('users');
  const results = users.find({ age: { $gte: 30 } });
  results.forEach(doc => {
    assert(doc.age >= 30, 'All results should have age >= 30');
  });
  passedTests++;
});

// Test 15: Query with $lte
totalTests++;
test('Query with $lte operator', () => {
  const users = db2.collection('users');
  const results = users.find({ age: { $lte: 35 } });
  results.forEach(doc => {
    assert(doc.age <= 35, 'All results should have age <= 35');
  });
  passedTests++;
});

// Test 16: Query with $in
totalTests++;
test('Query with $in operator', () => {
  const users = db2.collection('users');
  const results = users.find({ age: { $in: [25, 30, 35] } });
  results.forEach(doc => {
    assert([25, 30, 35].includes(doc.age), 'All results should have age in array');
  });
  passedTests++;
});

// Test 17: Query with $nin
totalTests++;
test('Query with $nin operator', () => {
  const users = db2.collection('users');
  const results = users.find({ age: { $nin: [25] } });
  results.forEach(doc => {
    assert(doc.age !== 25, 'All results should not have age 25');
  });
  passedTests++;
});

// Test 18: Query with $ne
totalTests++;
test('Query with $ne operator', () => {
  const users = db2.collection('users');
  const results = users.find({ age: { $ne: 30 } });
  results.forEach(doc => {
    assert(doc.age !== 30, 'All results should not have age 30');
  });
  passedTests++;
});

// Test 19: Query with $regex
totalTests++;
test('Query with $regex operator', () => {
  const users = db2.collection('users');
  const results = users.find({ name: { $regex: 'John', $options: 'i' } });
  assert(results.length >= 1, 'Should find documents matching regex');
  results.forEach(doc => {
    assert(/John/i.test(doc.name), 'All results should match regex');
  });
  passedTests++;
});

// Test 20: Find with sort
totalTests++;
test('Find with sort', () => {
  const users = db2.collection('users');
  const results = users.find({}, { sort: { age: 1 } });
  assert(results.length >= 2, 'Should have multiple results');
  for (let i = 1; i < results.length; i++) {
    assert(results[i].age >= results[i-1].age, 'Results should be sorted ascending');
  }
  passedTests++;
});

// Test 21: Find with sort desc
totalTests++;
test('Find with sort descending', () => {
  const users = db2.collection('users');
  const results = users.find({}, { sort: { age: -1 } });
  assert(results.length >= 2, 'Should have multiple results');
  for (let i = 1; i < results.length; i++) {
    assert(results[i].age <= results[i-1].age, 'Results should be sorted descending');
  }
  passedTests++;
});

// Test 22: Find with limit
totalTests++;
test('Find with limit', () => {
  const users = db2.collection('users');
  const results = users.find({}, { limit: 2 });
  assert(results.length <= 2, 'Should limit results to 2');
  passedTests++;
});

// Test 23: Find with skip
totalTests++;
test('Find with skip', () => {
  const users = db2.collection('users');
  const allResults = users.find({});
  const skippedResults = users.find({}, { skip: 1 });
  assert(skippedResults.length === allResults.length - 1, 'Should skip first result');
  passedTests++;
});

// Test 24: Find with projection
totalTests++;
test('Find with projection', () => {
  const users = db2.collection('users');
  const results = users.find({}, { projection: { name: 1, age: 1, _id: 1 } });
  assert(results.length >= 1, 'Should have results');
  const first = results[0];
  assert(first.name !== undefined, 'Should have name field');
  assert(first.age !== undefined, 'Should have age field');
  assert(first.email === undefined, 'Should not have email field');
  passedTests++;
});

// Test 25: Count documents
totalTests++;
test('Count documents', () => {
  const users = db2.collection('users');
  const totalCount = users.count();
  assert(totalCount >= 3, 'Should count at least 3 documents');
  
  const filteredCount = users.count({ age: { $gt: 30 } });
  assert(filteredCount >= 1, 'Should count filtered documents');
  passedTests++;
});

// Test 26: Delete single document
totalTests++;
test('Delete single document', () => {
  const users = db2.collection('users');
  const beforeCount = users.count();
  
  // Insert a document to delete
  const doc = users.insert({ name: 'To Delete', age: 99 });
  const afterInsert = users.count();
  assert(afterInsert === beforeCount + 1, 'Document should be inserted');
  
  const result = users.delete({ _id: doc._id }, { multi: false });
  assert(result.deletedCount === 1, 'Should delete 1 document');
  
  const afterDelete = users.count();
  assert(afterDelete === beforeCount, 'Count should return to original');
  passedTests++;
});

// Test 27: Delete multiple documents
totalTests++;
test('Delete multiple documents', () => {
  const users = db2.collection('users');
  // Insert multiple documents to delete
  users.insert([
    { name: 'Delete Me 1', age: 88 },
    { name: 'Delete Me 2', age: 88 }
  ]);
  
  const beforeCount = users.count({ age: 88 });
  const result = users.delete({ age: 88 }, { multi: true });
  assert(result.deletedCount === beforeCount, 'Should delete all matching documents');
  
  const afterCount = users.count({ age: 88 });
  assert(afterCount === 0, 'Should have no documents with age 88');
  passedTests++;
});

// Test 28: Remove all documents
totalTests++;
test('Remove all documents from collection', () => {
  const testCollection = db2.collection('test_remove');
  testCollection.insert([
    { name: 'Doc 1' },
    { name: 'Doc 2' },
    { name: 'Doc 3' }
  ]);
  
  assert(testCollection.count() === 3, 'Should have 3 documents');
  const result = testCollection.remove();
  assert(result === true, 'Remove should return true');
  assert(testCollection.count() === 0, 'Should have 0 documents');
  passedTests++;
});

// Test 29: Create regular index
totalTests++;
test('Create regular index', () => {
  const users = db2.collection('users');
  const result = db2.createIndex('users', 'email');
  assert(result === true, 'Should create index successfully');
  passedTests++;
});

// Test 30: Create unique index
totalTests++;
test('Create unique index', () => {
  const users = db2.collection('users');
  const result = users.createUniqueIndex('email');
  assert(result === true, 'Should create unique index');
  passedTests++;
});

// Test 31: Unique index constraint on insert
totalTests++;
test('Unique index constraint on insert', () => {
  const users = db2.collection('users');
  // Try to insert duplicate email
  let errorThrown = false;
  try {
    users.insert({ name: 'Duplicate', age: 50, email: 'john@example.com' });
  } catch (error) {
    errorThrown = true;
    assert(error.message.includes('must be unique'), 'Should throw unique constraint error');
  }
  assert(errorThrown, 'Should throw error for duplicate unique field');
  passedTests++;
});

// Test 32: Unique index constraint on update
totalTests++;
test('Unique index constraint on update', () => {
  const users = db2.collection('users');
  const jane = users.findOne({ name: 'Jane Smith' });
  let errorThrown = false;
  try {
    users.update(
      { _id: jane._id },
      { $set: { email: 'john@example.com' } }
    );
  } catch (error) {
    errorThrown = true;
    assert(error.message.includes('must be unique'), 'Should throw unique constraint error');
  }
  assert(errorThrown, 'Should throw error for duplicate unique field on update');
  passedTests++;
});

// Test 33: Update with upsert
totalTests++;
test('Update with upsert', () => {
  const users = db2.collection('users');
  const result = users.update(
    { name: 'Upsert User', age: 40 },
    { $set: { email: 'upsert@example.com', city: 'Seattle' } },
    { upsert: true }
  );
  assert(result.upsertedCount === 1, 'Should upsert 1 document');
  
  const upserted = users.findOne({ name: 'Upsert User' });
  assert(upserted !== null, 'Should find upserted document');
  assert(upserted.email === 'upsert@example.com', 'Upserted document should have email');
  passedTests++;
});

// Test 34: List collections
totalTests++;
test('List collections', () => {
  const collections = db2.listCollections();
  assert(Array.isArray(collections), 'Should return array');
  assert(collections.includes('users'), 'Should include users collection');
  passedTests++;
});

// Test 35: Drop collection
totalTests++;
test('Drop collection', () => {
  const testCol = db2.collection('to_drop');
  testCol.insert({ name: 'Test' });
  assert(db2.listCollections().includes('to_drop'), 'Collection should exist');
  
  const result = db2.dropCollection('to_drop');
  assert(result === true, 'Should drop collection');
  assert(!db2.listCollections().includes('to_drop'), 'Collection should be removed');
  passedTests++;
});

// Test 36: Collection createIndex method
totalTests++;
test('Collection createIndex method', () => {
  const users = db2.collection('users');
  const result = users.createIndex('name');
  assert(result === true, 'Should create index via collection method');
  passedTests++;
});

// Test 37: Get database path
totalTests++;
test('Get database path', () => {
  const path = db2.getDbPath();
  assert(typeof path === 'string', 'Should return string');
  assert(path.includes('test_db'), 'Should contain test_db path');
  passedTests++;
});

// Test 38: Close database
totalTests++;
test('Close database', () => {
  db2.close();
  // Should not throw error
  assert(true, 'Should close without error');
  passedTests++;
});

// Test 39: Persistence - reload and verify data
totalTests++;
test('Persistence - reload and verify', () => {
  const newDb = new NoSQLite('./test_db');
  const users = newDb.collection('users');
  const john = users.findOne({ name: 'John Doe' });
  assert(john !== null, 'Should find persisted document');
  assert(john.age === 31, 'Should have updated age');
  assert(john.city === 'New York', 'Should have updated city');
  newDb.close();
  passedTests++;
});

// Test 40: Complex query with multiple conditions
totalTests++;
test('Complex query with multiple conditions', () => {
  const users = db2.collection('users');
  const results = users.find({
    age: { $gte: 25, $lte: 35 }
  });
  results.forEach(doc => {
    assert(doc.age >= 25 && doc.age <= 35, 'Should match range');
  });
  passedTests++;
});

// Test 41: Query with array value (simple in)
totalTests++;
test('Query with array value (simple in)', () => {
  const users = db2.collection('users');
  const results = users.find({ age: [25, 30, 35] });
  results.forEach(doc => {
    assert([25, 30, 35].includes(doc.age), 'Should match array values');
  });
  passedTests++;
});

// Summary
log('\n' + '='.repeat(50), 'cyan');
log(`\n📊 Test Results: ${passedTests}/${totalTests} tests passed`, passedTests === totalTests ? 'green' : 'yellow');
if (totalTests > 40) {
  log(`   (Including $unset operator test)`, 'cyan');
}
log('='.repeat(50) + '\n', 'cyan');

if (passedTests === totalTests) {
  log('🎉 All tests passed!', 'green');
  process.exit(0);
} else {
  log(`⚠️  ${totalTests - passedTests} test(s) failed`, 'red');
  process.exit(1);
}

# NoSQLite

A lightweight, production-ready NoSQL database for Node.js with MongoDB-like API, file-based persistence, indexing support, and comprehensive testing.

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D10.0.0-brightgreen)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Zero Dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)](package.json)

## Features

- 🗄️ **Collections & Documents** - MongoDB-like collection and document model
- 💾 **File-based Persistence** - Automatic JSON file storage with data integrity
- 🔍 **Advanced Queries** - Support for filtering, sorting, projection, and operators
- ⚡ **Indexing** - Create indexes (regular and unique) for improved query performance
- 📝 **CRUD Operations** - Full Insert, Find, Update, Delete operations with upsert support
- 🎯 **Query Operators** - `$eq`, `$ne`, `$gt`, `$gte`, `$lt`, `$lte`, `$in`, `$nin`, `$regex`
- 🔒 **Unique Constraints** - Enforce data integrity with unique indexes
- 🚀 **Zero Dependencies** - Uses only Node.js built-in modules
- ✅ **Well Tested** - Comprehensive test suite covering all operations
- 🔄 **Auto Timestamps** - Automatic `_createdAt` and `_updatedAt` fields
- 📊 **Pagination Support** - Built-in `limit` and `skip` for efficient pagination

## Requirements

- **Node.js** >= 10.0.0
- **File System** access for data persistence
- **Permissions** to read/write in the database directory

## Installation

```bash
npm install nosqlite-db
```

### For Development

```bash
git clone <repository-url>
cd nosqlite-db
npm test  # Run comprehensive test suite
```

## Quick Start

```javascript
const NoSQLite = require('nosqlite-db');

// Create or connect to database
const db = new NoSQLite('./my_database');

// Get a collection
const users = db.collection('users');

// Insert a document
const user = users.insert({
  name: 'John Doe',
  email: 'john@example.com',
  age: 30
});

// Find documents
const allUsers = users.find();
const youngUsers = users.find({ age: { $lt: 25 } });

// Update documents
users.update(
  { email: 'john@example.com' },
  { $set: { age: 31 } }
);

// Delete documents
users.delete({ email: 'john@example.com' });
```

## API Reference

### Database

#### `new NoSQLite(dbPath)`
Create a new database instance.

**Parameters:**
- `dbPath` (string, optional): Path to database directory. Default: `'./nosqlite_db'`

**Example:**
```javascript
const db = new NoSQLite('./my_db');
```

#### `db.collection(name)`
Get or create a collection.

**Parameters:**
- `name` (string): Collection name

**Returns:** Collection instance

**Example:**
```javascript
const users = db.collection('users');
```

#### `db.dropCollection(name)`
Drop a collection and delete its data file.

**Parameters:**
- `name` (string): Collection name

**Returns:** `boolean`

#### `db.listCollections()`
List all collection names in the database.

**Returns:** `string[]`

#### `db.createIndex(collectionName, field, options)`
Create an index on a collection field.

**Parameters:**
- `collectionName` (string): Collection name
- `field` (string): Field name to index
- `options` (object, optional): Index options
  - `unique` (boolean): Create unique index
  - `sparse` (boolean): Create sparse index

**Returns:** `boolean`

**Example:**
```javascript
db.createIndex('users', 'email', { unique: true });
```

### Collection

#### `collection.insert(data)`
Insert one or multiple documents.

**Parameters:**
- `data` (object|object[]): Document(s) to insert

**Returns:** Inserted document(s) with `_id`, `_createdAt`, `_updatedAt`

**Example:**
```javascript
// Insert one
const user = users.insert({ name: 'John', age: 30 });

// Insert multiple
const usersList = users.insert([
  { name: 'Alice', age: 25 },
  { name: 'Bob', age: 35 }
]);
```

#### `collection.find(query, options)`
Find documents matching query.

**Parameters:**
- `query` (object, optional): Query object (MongoDB-style)
- `options` (object, optional): Query options
  - `sort` (object): Sort specification `{ field: 1 }` or `{ field: -1 }`
  - `limit` (number): Limit number of results
  - `skip` (number): Skip number of results
  - `projection` (object): Field projection

**Returns:** `array` of matching documents

**Example:**
```javascript
// Find all
const all = users.find();

// Find with query
const youngUsers = users.find({ age: { $lt: 25 } });

// Find with options
const sorted = users.find({}, { sort: { age: -1 }, limit: 10 });
```

#### `collection.findOne(query, options)`
Find one document matching query.

**Parameters:**
- `query` (object, optional): Query object
- `options` (object, optional): Query options

**Returns:** Matching document or `null`

**Example:**
```javascript
const user = users.findOne({ email: 'john@example.com' });
```

#### `collection.update(query, update, options)`
Update documents matching query.

**Parameters:**
- `query` (object): Query object
- `update` (object): Update operations
  - `$set` (object): Set fields
  - `$unset` (array): Unset fields
  - `$inc` (object): Increment numeric fields
- `options` (object, optional): Update options
  - `multi` (boolean): Update multiple documents (default: `true`)
  - `upsert` (boolean): Insert if no match found

**Returns:** `object` with `modifiedCount` and `upsertedCount`

**Example:**
```javascript
// Update with $set
users.update(
  { email: 'john@example.com' },
  { $set: { age: 31 } }
);

// Update with $inc
users.update(
  { email: 'john@example.com' },
  { $inc: { age: 1 } }
);

// Upsert
users.update(
  { email: 'new@example.com' },
  { $set: { name: 'New User', age: 20 } },
  { upsert: true }
);
```

#### `collection.delete(query, options)`
Delete documents matching query.

**Parameters:**
- `query` (object): Query object
- `options` (object, optional): Delete options
  - `multi` (boolean): Delete multiple documents (default: `true`)

**Returns:** `object` with `deletedCount`

**Example:**
```javascript
// Delete one
users.delete({ email: 'john@example.com' }, { multi: false });

// Delete multiple
users.delete({ age: { $lt: 18 } });
```

#### `collection.count(query)`
Count documents matching query.

**Parameters:**
- `query` (object, optional): Query object

**Returns:** `number`

**Example:**
```javascript
const count = users.count({ age: { $gte: 18 } });
```

#### `collection.remove()`
Remove all documents from collection.

**Returns:** `boolean`

#### `collection.createUniqueIndex(field, options)`
Create a unique index on a field. This is a convenience method for creating unique indexes.

**Parameters:**
- `field` (string): Field name to create unique index on
- `options` (object, optional): Additional index options (sparse)

**Returns:** `boolean`

**Example:**
```javascript
// Make email field unique
users.createUniqueIndex('email');

// Make username unique with sparse option
users.createUniqueIndex('username', { sparse: true });
```

#### `collection.createIndex(field, options)`
Create an index on a field.

**Parameters:**
- `field` (string): Field name to create index on
- `options` (object, optional): Index options (unique, sparse)

**Returns:** `boolean`

**Example:**
```javascript
// Create regular index
users.createIndex('name');

// Create unique index
users.createIndex('email', { unique: true });
```

## Query Operators

### Comparison Operators

- `$eq` - Equal
- `$ne` - Not equal
- `$gt` - Greater than
- `$gte` - Greater than or equal
- `$lt` - Less than
- `$lte` - Less than or equal

**Example:**
```javascript
users.find({ age: { $gte: 18, $lt: 65 } });
users.find({ status: { $ne: 'deleted' } });
```

### Array Operators

- `$in` - Value in array
- `$nin` - Value not in array

**Example:**
```javascript
users.find({ role: { $in: ['admin', 'moderator'] } });
users.find({ status: { $nin: ['banned', 'suspended'] } });
```

### Regular Expression

- `$regex` - Regular expression match
- `$options` - Regex options (i, m, etc.)

**Example:**
```javascript
users.find({ email: { $regex: '@gmail\\.com$', $options: 'i' } });
```

## Examples

### Complete Example

```javascript
const NoSQLite = require('nosqlite');

// Initialize database
const db = new NoSQLite('./my_app_db');

// Get users collection
const users = db.collection('users');

// Create unique index on email (two ways to do it)
users.createUniqueIndex('email');  // Easy way!
// OR: db.createIndex('users', 'email', { unique: true });

// You can make multiple fields unique
users.createUniqueIndex('username'); // Multiple unique fields supported

// Insert users
users.insert([
  { name: 'John Doe', email: 'john@example.com', age: 30, role: 'user' },
  { name: 'Jane Smith', email: 'jane@example.com', age: 25, role: 'admin' },
  { name: 'Bob Wilson', email: 'bob@example.com', age: 35, role: 'user' }
]);

// Find users
const allUsers = users.find();
const admins = users.find({ role: 'admin' });
const youngUsers = users.find({ age: { $lt: 30 } });

// Update user
users.update(
  { email: 'john@example.com' },
  { $set: { age: 31, status: 'active' } }
);

// Find with sorting and limiting
const sortedUsers = users.find(
  {},
  { sort: { age: -1 }, limit: 5 }
);

// Count documents
const userCount = users.count({ role: 'user' });

// Delete user
users.delete({ email: 'john@example.com' });
```

## Data Persistence

NoSQLite automatically persists data to JSON files in the database directory. Each collection is stored as a separate JSON file. Data is saved synchronously after each write operation to ensure consistency.

**Database Structure:**
```
my_database/
  ├── users.json
  ├── products.json
  └── orders.json
```

### Data Integrity

- All write operations are immediately persisted to disk
- Automatic `_id` generation ensures unique document identifiers
- Timestamps (`_createdAt`, `_updatedAt`) are automatically maintained
- Unique indexes enforce data integrity at the application level

### Backup Strategy

For production use, implement regular backups:

```javascript
const fs = require('fs');
const path = require('path');

// Simple backup function
function backupDatabase(dbPath, backupDir) {
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const backupPath = path.join(backupDir, `backup-${timestamp}`);
  
  if (!fs.existsSync(backupPath)) {
    fs.mkdirSync(backupPath, { recursive: true });
  }
  
  // Copy all collection files
  const files = fs.readdirSync(dbPath).filter(f => f.endsWith('.json'));
  files.forEach(file => {
    fs.copyFileSync(
      path.join(dbPath, file),
      path.join(backupPath, file)
    );
  });
  
  return backupPath;
}
```

## Production Deployment

### Best Practices

1. **Database Location**
   ```javascript
   // Use absolute paths in production
   const path = require('path');
   const dbPath = path.resolve(__dirname, 'data', 'database');
   const db = new NoSQLite(dbPath);
   ```

2. **Error Handling**
   ```javascript
   const db = new NoSQLite('./production_db');
   const users = db.collection('users');
   
   try {
     const user = users.insert({ email: 'user@example.com' });
   } catch (error) {
     if (error.message.includes('must be unique')) {
       // Handle duplicate key error
       console.error('Duplicate email detected');
     } else {
       // Handle other errors
       console.error('Insert failed:', error);
     }
   }
   ```

3. **Graceful Shutdown**
   ```javascript
   // Close database on application exit
   process.on('SIGINT', () => {
     db.close();
     process.exit(0);
   });
   
   process.on('SIGTERM', () => {
     db.close();
     process.exit(0);
   });
   ```

4. **Index Creation**
   ```javascript
   // Create indexes at application startup
   const users = db.collection('users');
   users.createUniqueIndex('email');
   users.createUniqueIndex('username');
   users.createIndex('createdAt'); // For sorting/filtering
   ```

5. **Connection Pooling**
   ```javascript
   // Use a single database instance across your application
   // Create once, reuse everywhere
   module.exports = new NoSQLite('./production_db');
   ```

## Performance Optimization

### Indexing Strategy

- **Create indexes** for frequently queried fields
- **Use unique indexes** for fields that must be unique (email, username, etc.)
- **Index fields** used in sorting operations

```javascript
// Good: Index before inserting large datasets
users.createIndex('email');
users.createIndex('age');

// Then insert
users.insert(largeUserArray);
```

### Query Optimization

1. **Use projection** to reduce data transfer:
   ```javascript
   // Only fetch needed fields
   users.find({}, { projection: { name: 1, email: 1, _id: 1 } });
   ```

2. **Use limit** for pagination:
   ```javascript
   // Paginate large result sets
   const page1 = users.find({}, { limit: 20, skip: 0 });
   const page2 = users.find({}, { limit: 20, skip: 20 });
   ```

3. **Use specific queries** instead of fetching all:
   ```javascript
   // Bad: Fetch all then filter
   const all = users.find();
   const filtered = all.filter(u => u.age > 18);
   
   // Good: Query with filter
   const filtered = users.find({ age: { $gt: 18 } });
   ```

### Memory Management

- **Limit result sets** - Always use `limit` for large collections
- **Use pagination** - Process data in chunks
- **Close database** properly on application shutdown

## Security Considerations

1. **File Permissions**: Set appropriate file permissions for database directory
   ```bash
   chmod 700 /path/to/database
   ```

2. **Input Validation**: Validate user input before inserting:
   ```javascript
   function validateUser(userData) {
     if (!userData.email || !userData.email.includes('@')) {
       throw new Error('Invalid email');
     }
     // Add more validation...
     return userData;
   }
   
   users.insert(validateUser(userData));
   ```

3. **Path Sanitization**: Use absolute paths and validate collection names
   ```javascript
   function sanitizeCollectionName(name) {
     // Only allow alphanumeric and underscores
     if (!/^[a-zA-Z0-9_]+$/.test(name)) {
       throw new Error('Invalid collection name');
     }
     return name;
   }
   ```

4. **Access Control**: Implement application-level access control

## Error Handling

NoSQLite throws errors in the following scenarios:

1. **Unique Constraint Violations**:
   ```javascript
   try {
     users.insert({ email: 'existing@example.com' });
   } catch (error) {
     if (error.message.includes('must be unique')) {
       // Handle duplicate
     }
   }
   ```

2. **File System Errors**: Handle disk full, permission denied, etc.
   ```javascript
   try {
     users.insert(data);
   } catch (error) {
     if (error.code === 'ENOSPC') {
       // Disk full
     } else if (error.code === 'EACCES') {
       // Permission denied
     }
   }
   ```

3. **Invalid Queries**: Always validate query objects

## Testing

The package includes comprehensive tests covering all operations:

```bash
npm test
```

**Test Coverage:**
- ✅ Database initialization and configuration
- ✅ Collection operations (create, list, drop)
- ✅ CRUD operations (insert, find, update, delete)
- ✅ Query operators ($gt, $lt, $in, $regex, etc.)
- ✅ Query options (sort, limit, skip, projection)
- ✅ Index operations (regular and unique)
- ✅ Unique constraint validation
- ✅ Upsert operations
- ✅ Data persistence and reload
- ✅ Error handling

## Limitations

- **Single Process**: Designed for single-process applications. For multi-process access, consider a wrapper or use a different database.
- **File Size**: Performance degrades with very large files (>100MB per collection). Consider splitting collections or archiving old data.
- **No Transactions**: No ACID transaction support. Each operation is atomic but not transactional across collections.
- **No Concurrency Control**: Multiple processes writing to the same database may cause data corruption. Use file locking if needed.
- **Synchronous I/O**: Uses synchronous file operations which may block the event loop on large operations.

## Troubleshooting

### Issue: "Duplicate key error" when not expected
**Solution**: Check if unique index exists on the field. Remove or recreate the index if needed.

### Issue: Data not persisting
**Solution**: Ensure the database directory has write permissions and sufficient disk space.

### Issue: Performance issues with large collections
**Solution**: 
- Create indexes on frequently queried fields
- Use `limit` and `projection` in queries
- Consider splitting large collections

### Issue: "Cannot read property of undefined"
**Solution**: Always check if `findOne` returns `null` before accessing properties:
```javascript
const user = users.findOne({ email: 'test@example.com' });
if (user) {
  // Safe to access user properties
}
```

## Migration & Upgrades

### Backing Up Data Before Upgrade

```javascript
// Before upgrading, backup your data
const fs = require('fs');
const path = require('path');

const backupPath = path.join(__dirname, 'backups', Date.now().toString());
fs.mkdirSync(backupPath, { recursive: true });

const dbPath = './your_database';
const files = fs.readdirSync(dbPath);
files.forEach(file => {
  if (file.endsWith('.json')) {
    fs.copyFileSync(
      path.join(dbPath, file),
      path.join(backupPath, file)
    );
  }
});
```

### Version Migration

When upgrading NoSQLite versions:
1. **Backup** your database directory
2. **Test** the new version with a copy of your data
3. **Update** the package
4. **Verify** all operations work correctly

## Examples

### Complete Production Example

```javascript
const NoSQLite = require('nosqlite-db');
const path = require('path');

// Production setup
const dbPath = path.resolve(__dirname, 'data', 'database');
const db = new NoSQLite(dbPath);

// Initialize collections and indexes
const users = db.collection('users');
users.createUniqueIndex('email');
users.createIndex('createdAt');

// Application code with error handling
async function createUser(userData) {
  try {
    // Validate input
    if (!userData.email || !userData.name) {
      throw new Error('Email and name are required');
    }
    
    // Insert with error handling
    const user = users.insert({
      ...userData,
      createdAt: new Date().toISOString(),
      status: 'active'
    });
    
    return user;
  } catch (error) {
    if (error.message.includes('must be unique')) {
      throw new Error('User with this email already exists');
    }
    throw error;
  }
}

// Pagination example
function getUsers(page = 1, pageSize = 20) {
  const skip = (page - 1) * pageSize;
  return users.find(
    { status: 'active' },
    {
      sort: { createdAt: -1 },
      limit: pageSize,
      skip: skip,
      projection: { name: 1, email: 1, createdAt: 1, _id: 1 }
    }
  );
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Closing database...');
  db.close();
  process.exit(0);
});
```

### REST API Example

```javascript
const express = require('express');
const NoSQLite = require('nosqlite-db');

const app = express();
const db = new NoSQLite('./api_db');
const users = db.collection('users');

users.createUniqueIndex('email');

app.use(express.json());

// GET /users
app.get('/users', (req, res) => {
  const { page = 1, limit = 20, age } = req.query;
  const query = age ? { age: { $gte: parseInt(age) } } : {};
  
  const results = users.find(query, {
    sort: { createdAt: -1 },
    limit: parseInt(limit),
    skip: (parseInt(page) - 1) * parseInt(limit)
  });
  
  res.json({ users: results, count: results.length });
});

// POST /users
app.post('/users', (req, res) => {
  try {
    const user = users.insert(req.body);
    res.status(201).json(user);
  } catch (error) {
    if (error.message.includes('must be unique')) {
      res.status(409).json({ error: 'Email already exists' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

app.listen(3000);
```

## API Reference

### Database Methods

#### `new NoSQLite(dbPath)`
Create a new database instance.

**Parameters:**
- `dbPath` (string, optional): Path to database directory. Default: `'./nosqlite_db'`

**Returns:** Database instance

**Example:**
```javascript
const db = new NoSQLite('./my_db');
```

#### `db.collection(name)`
Get or create a collection. Collections are created lazily on first access.

**Parameters:**
- `name` (string): Collection name (must be alphanumeric with underscores)

**Returns:** Collection instance

**Example:**
```javascript
const users = db.collection('users');
```

#### `db.dropCollection(name)`
Drop a collection and delete its data file permanently.

**Parameters:**
- `name` (string): Collection name

**Returns:** `boolean` - `true` if successful

**Example:**
```javascript
db.dropCollection('old_data');
```

#### `db.listCollections()`
List all collection names in the database.

**Returns:** `string[]` - Array of collection names

**Example:**
```javascript
const collections = db.listCollections();
// ['users', 'products', 'orders']
```

#### `db.createIndex(collectionName, field, options)`
Create an index on a collection field.

**Parameters:**
- `collectionName` (string): Collection name
- `field` (string): Field name to index
- `options` (object, optional): Index options
  - `unique` (boolean): Create unique index (default: `false`)
  - `sparse` (boolean): Create sparse index (default: `false`)

**Returns:** `boolean` - `true` if successful

**Example:**
```javascript
db.createIndex('users', 'email', { unique: true });
db.createIndex('users', 'age');
```

#### `db.getDbPath()`
Get the absolute path to the database directory.

**Returns:** `string` - Database path

**Example:**
```javascript
const dbPath = db.getDbPath();
console.log(`Database at: ${dbPath}`);
```

#### `db.close()`
Close the database connection and save all collections. Always call this before application shutdown.

**Returns:** `void`

**Example:**
```javascript
db.close();
```

### Collection Methods

#### `collection.insert(data)`
Insert one or multiple documents. Automatically adds `_id`, `_createdAt`, and `_updatedAt` fields.

**Parameters:**
- `data` (object|object[]): Document(s) to insert

**Returns:** Inserted document(s) with generated fields

**Throws:** `Error` if unique constraint violation

**Example:**
```javascript
// Insert one
const user = users.insert({ name: 'John', age: 30 });

// Insert multiple
const usersList = users.insert([
  { name: 'Alice', age: 25 },
  { name: 'Bob', age: 35 }
]);
```

#### `collection.find(query, options)`
Find documents matching query with optional sorting, pagination, and projection.

**Parameters:**
- `query` (object, optional): Query object (MongoDB-style)
- `options` (object, optional): Query options
  - `sort` (object): Sort specification `{ field: 1 }` (asc) or `{ field: -1 }` (desc)
  - `limit` (number): Limit number of results
  - `skip` (number): Skip number of results
  - `projection` (object): Field projection `{ field: 1 }` (include) or `{ field: 0 }` (exclude)

**Returns:** `array` of matching documents

**Example:**
```javascript
// Find all
const all = users.find();

// Find with query
const youngUsers = users.find({ age: { $lt: 25 } });

// Find with options
const sorted = users.find({}, { 
  sort: { age: -1 }, 
  limit: 10,
  skip: 20,
  projection: { name: 1, email: 1, _id: 1 }
});
```

#### `collection.findOne(query, options)`
Find one document matching query.

**Parameters:**
- `query` (object, optional): Query object
- `options` (object, optional): Query options (same as `find`)

**Returns:** Matching document or `null` if not found

**Example:**
```javascript
const user = users.findOne({ email: 'john@example.com' });
if (user) {
  console.log(user.name);
}
```

#### `collection.update(query, update, options)`
Update documents matching query. Supports `$set`, `$unset`, and `$inc` operators.

**Parameters:**
- `query` (object): Query object
- `update` (object): Update operations
  - `$set` (object): Set/update fields
  - `$unset` (array): Remove fields (array of field names)
  - `$inc` (object): Increment numeric fields
- `options` (object, optional): Update options
  - `multi` (boolean): Update multiple documents (default: `true`)
  - `upsert` (boolean): Insert if no match found (default: `false`)

**Returns:** `object` with `modifiedCount` and optionally `upsertedCount`

**Throws:** `Error` if unique constraint violation

**Example:**
```javascript
// Update with $set
users.update(
  { email: 'john@example.com' },
  { $set: { age: 31, city: 'New York' } }
);

// Update with $inc
users.update(
  { email: 'john@example.com' },
  { $inc: { age: 1, score: 10 } }
);

// Update with $unset
users.update(
  { email: 'john@example.com' },
  { $unset: ['tempField', 'oldData'] }
);

// Upsert
const result = users.update(
  { email: 'new@example.com' },
  { $set: { name: 'New User', age: 20 } },
  { upsert: true }
);
// result.upsertedCount === 1
```

#### `collection.delete(query, options)`
Delete documents matching query.

**Parameters:**
- `query` (object): Query object
- `options` (object, optional): Delete options
  - `multi` (boolean): Delete multiple documents (default: `true`)

**Returns:** `object` with `deletedCount`

**Example:**
```javascript
// Delete one
const result = users.delete({ email: 'john@example.com' }, { multi: false });

// Delete multiple
const result = users.delete({ age: { $lt: 18 } });
```

#### `collection.count(query)`
Count documents matching query.

**Parameters:**
- `query` (object, optional): Query object

**Returns:** `number` - Count of matching documents

**Example:**
```javascript
const totalUsers = users.count();
const activeUsers = users.count({ status: 'active' });
```

#### `collection.remove()`
Remove all documents from collection. **Warning:** This operation cannot be undone!

**Returns:** `boolean` - `true` if successful

**Example:**
```javascript
users.remove(); // All documents deleted
```

#### `collection.createUniqueIndex(field, options)`
Create a unique index on a field. Convenience method for creating unique indexes.

**Parameters:**
- `field` (string): Field name to create unique index on
- `options` (object, optional): Additional index options
  - `sparse` (boolean): Create sparse index (default: `false`)

**Returns:** `boolean` - `true` if successful

**Example:**
```javascript
users.createUniqueIndex('email');
users.createUniqueIndex('username', { sparse: true });
```

#### `collection.createIndex(field, options)`
Create an index on a field.

**Parameters:**
- `field` (string): Field name to create index on
- `options` (object, optional): Index options
  - `unique` (boolean): Create unique index (default: `false`)
  - `sparse` (boolean): Create sparse index (default: `false`)

**Returns:** `boolean` - `true` if successful

**Example:**
```javascript
users.createIndex('name');
users.createIndex('email', { unique: true });
```

## Query Operators

### Comparison Operators

- `$eq` - Equal
- `$ne` - Not equal
- `$gt` - Greater than
- `$gte` - Greater than or equal
- `$lt` - Less than
- `$lte` - Less than or equal

**Example:**
```javascript
users.find({ age: { $gte: 18, $lt: 65 } });
users.find({ status: { $ne: 'deleted' } });
```

### Array Operators

- `$in` - Value in array
- `$nin` - Value not in array

**Example:**
```javascript
users.find({ role: { $in: ['admin', 'moderator'] } });
users.find({ status: { $nin: ['banned', 'suspended'] } });
```

### Regular Expression

- `$regex` - Regular expression match
- `$options` - Regex options (`i` for case-insensitive, `m` for multiline, etc.)

**Example:**
```javascript
users.find({ email: { $regex: '@gmail\\.com$', $options: 'i' } });
users.find({ name: { $regex: '^John', $options: 'i' } });
```

### Array Value Matching

You can also use arrays directly for "in" matching:

```javascript
users.find({ age: [25, 30, 35] }); // Matches age in [25, 30, 35]
```

## Changelog

### Version 1.0.0
- Initial release
- Full CRUD operations
- Indexing support (regular and unique)
- Comprehensive query operators
- File-based persistence
- Auto-timestamps
- Comprehensive test suite

## License

MIT License

Copyright (c) 2024

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## Contributing

Contributions are welcome! Please follow these guidelines:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add some amazing feature'`)
4. **Run tests** to ensure everything works (`npm test`)
5. **Push** to the branch (`git push origin feature/amazing-feature`)
6. **Open** a Pull Request

### Development Setup

```bash
git clone <repository-url>
cd nosqlite-db
npm test  # Run tests
```

### Code Style

- Use JavaScript (ES6+)
- Follow existing code style
- Add tests for new features
- Update documentation as needed

## Support

For issues, questions, or contributions:
- **Issues**: Open an issue on GitHub
- **Questions**: Check the documentation or open a discussion
- **Contributions**: Submit a Pull Request

## Acknowledgments

- Inspired by MongoDB's query API
- Built with Node.js built-in modules
- Designed for simplicity and ease of use

---

**Made with ❤️ for developers who need a simple, file-based NoSQL database**

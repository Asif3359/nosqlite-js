const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * NoSQLite - A lightweight NoSQL database similar to MongoDB
 * Supports collections, documents, queries, indexing, and persistence
 */
class NoSQLite {
  constructor(dbPath = './nosqlite_db') {
    this.dbPath = path.resolve(dbPath);
    this.collections = new Map();
    this.indexes = new Map(); // Store indexes per collection
    
    // Ensure database directory exists
    if (!fs.existsSync(this.dbPath)) {
      fs.mkdirSync(this.dbPath, { recursive: true });
    }
    
    // Load existing collections
    this._loadCollections();
  }

  /**
   * Get or create a collection
   * @param {string} name - Collection name
   * @returns {Collection} Collection instance
   */
  collection(name) {
    if (!this.collections.has(name)) {
      const collection = new Collection(name, this);
      this.collections.set(name, collection);
      collection._load(); // Load existing data
    }
    return this.collections.get(name);
  }

  /**
   * Drop a collection
   * @param {string} name - Collection name
   * @returns {boolean} Success status
   */
  dropCollection(name) {
    const filePath = path.join(this.dbPath, `${name}.json`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    this.collections.delete(name);
    this.indexes.delete(name);
    return true;
  }

  /**
   * List all collection names
   * @returns {string[]} Array of collection names
   */
  listCollections() {
    return fs.existsSync(this.dbPath)
      ? fs.readdirSync(this.dbPath)
          .filter(file => file.endsWith('.json'))
          .map(file => path.basename(file, '.json'))
      : [];
  }

  /**
   * Create an index on a collection field
   * @param {string} collectionName - Collection name
   * @param {string} field - Field name to index
   * @param {object} options - Index options (unique, sparse)
   * @returns {boolean} Success status
   */
  createIndex(collectionName, field, options = {}) {
    const collection = this.collection(collectionName);
    if (!this.indexes.has(collectionName)) {
      this.indexes.set(collectionName, new Map());
    }
    
    const collectionIndexes = this.indexes.get(collectionName);
    const indexKey = `${field}_${options.unique ? 'unique' : ''}`;
    
    collectionIndexes.set(field, {
      field,
      unique: options.unique || false,
      sparse: options.sparse || false,
      values: new Map()
    });

    // Build index from existing documents
    collection.find().forEach(doc => {
      if (doc[field] !== undefined) {
        const index = collectionIndexes.get(field);
        const value = doc[field];
        if (!index.values.has(value)) {
          index.values.set(value, []);
        }
        index.values.get(value).push(doc._id);
      }
    });

    return true;
  }

  /**
   * Load existing collections from disk
   * @private
   */
  _loadCollections() {
    if (!fs.existsSync(this.dbPath)) return;
    
    const files = fs.readdirSync(this.dbPath).filter(file => file.endsWith('.json'));
    files.forEach(file => {
      const collectionName = path.basename(file, '.json');
      // Collections will be loaded lazily when accessed
    });
  }

  /**
   * Get the database path
   * @returns {string} Database path
   */
  getDbPath() {
    return this.dbPath;
  }

  /**
   * Close database connection (cleanup)
   */
  close() {
    // Save all collections
    this.collections.forEach(collection => {
      collection._save();
    });
  }
}

/**
 * Collection - Handles documents within a collection
 */
class Collection {
  constructor(name, db) {
    this.name = name;
    this.db = db;
    this.documents = [];
    this.filePath = path.join(db.dbPath, `${name}.json`);
    this._nextId = 1;
  }

  /**
   * Insert one or multiple documents
   * @param {object|object[]} data - Document(s) to insert
   * @returns {object|object[]} Inserted document(s) with _id
   */
  insert(data) {
    const isArray = Array.isArray(data);
    const documents = isArray ? data : [data];
    const inserted = [];

    documents.forEach(doc => {
      const document = {
        ...doc,
        _id: this._generateId(),
        _createdAt: new Date().toISOString(),
        _updatedAt: new Date().toISOString()
      };

      // Validate unique indexes
      this._validateUniqueIndexes(document);

      this.documents.push(document);
      inserted.push(document);

      // Update indexes
      this._updateIndexes(document, 'insert');
    });

    this._save();
    return isArray ? inserted : inserted[0];
  }

  /**
   * Find documents matching query
   * @param {object} query - Query object (MongoDB-style)
   * @param {object} options - Query options (limit, sort, skip, projection)
   * @returns {array} Array of matching documents
   */
  find(query = {}, options = {}) {
    let results = this.documents.filter(doc => this._matchesQuery(doc, query));

    // Apply sorting
    if (options.sort) {
      results = this._sort(results, options.sort);
    }

    // Apply skip
    if (options.skip) {
      results = results.slice(options.skip);
    }

    // Apply limit
    if (options.limit) {
      results = results.slice(0, options.limit);
    }

    // Apply projection
    if (options.projection) {
      results = results.map(doc => this._applyProjection(doc, options.projection));
    }

    return results;
  }

  /**
   * Find one document matching query
   * @param {object} query - Query object
   * @param {object} options - Query options
   * @returns {object|null} Matching document or null
   */
  findOne(query = {}, options = {}) {
    const results = this.find(query, { ...options, limit: 1 });
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Update documents matching query
   * @param {object} query - Query object
   * @param {object} update - Update operations ($set, $unset, etc.)
   * @param {object} options - Update options (multi, upsert)
   * @returns {object} Update result
   */
  update(query, update, options = {}) {
    const matches = this.documents.filter(doc => this._matchesQuery(doc, query));
    
    if (matches.length === 0 && options.upsert) {
      const newDoc = this.insert(query);
      this.update({ _id: newDoc._id }, update);
      return { modifiedCount: 1, upsertedCount: 1 };
    }

    let modifiedCount = 0;
    const updateMulti = options.multi !== false;

    for (let i = 0; i < matches.length; i++) {
      const doc = matches[i];
      const index = this.documents.indexOf(doc);
      if (index === -1) continue;

      // Create a copy to check unique constraints before applying
      const updatedDoc = { ...this.documents[index] };

      // Handle $set operator
      if (update.$set) {
        Object.assign(updatedDoc, update.$set);
      }

      // Handle $unset operator
      if (update.$unset) {
        update.$unset.forEach(field => {
          delete updatedDoc[field];
        });
      }

      // Handle $inc operator
      if (update.$inc) {
        Object.keys(update.$inc).forEach(field => {
          updatedDoc[field] = (updatedDoc[field] || 0) + update.$inc[field];
        });
      }

      // Direct assignment (if no operators)
      if (!update.$set && !update.$unset && !update.$inc) {
        Object.keys(update).forEach(key => {
          updatedDoc[key] = update[key];
        });
      }

      // Validate unique constraints before applying update
      this._validateUniqueIndexesOnUpdate(updatedDoc, this.documents[index]._id);

      // Apply changes to actual document
      if (update.$set) {
        Object.assign(this.documents[index], update.$set);
      }

      if (update.$unset) {
        update.$unset.forEach(field => {
          delete this.documents[index][field];
        });
      }

      if (update.$inc) {
        Object.keys(update.$inc).forEach(field => {
          this.documents[index][field] = (this.documents[index][field] || 0) + update.$inc[field];
        });
      }

      if (!update.$set && !update.$unset && !update.$inc) {
        Object.keys(update).forEach(key => {
          this.documents[index][key] = update[key];
        });
      }

      this.documents[index]._updatedAt = new Date().toISOString();
      modifiedCount++;

      // Update indexes (need to remove old values first)
      this._updateIndexes(this.documents[index], 'delete');
      this._updateIndexes(this.documents[index], 'insert');

      if (!updateMulti) break;
    }

    this._save();
    return { modifiedCount };
  }

  /**
   * Delete documents matching query
   * @param {object} query - Query object
   * @param {object} options - Delete options (multi)
   * @returns {object} Delete result
   */
  delete(query, options = {}) {
    const matches = this.documents.filter(doc => this._matchesQuery(doc, query));
    const deleteMulti = options.multi !== false;

    let deletedCount = 0;
    const toDelete = deleteMulti ? matches : matches.slice(0, 1);

    toDelete.forEach(doc => {
      const index = this.documents.indexOf(doc);
      if (index !== -1) {
        // Remove from indexes
        this._updateIndexes(this.documents[index], 'delete');
        this.documents.splice(index, 1);
        deletedCount++;
      }
    });

    this._save();
    return { deletedCount };
  }

  /**
   * Count documents matching query
   * @param {object} query - Query object
   * @returns {number} Count of matching documents
   */
  count(query = {}) {
    return this.documents.filter(doc => this._matchesQuery(doc, query)).length;
  }

  /**
   * Remove all documents from collection
   * @returns {boolean} Success status
   */
  remove() {
    this.documents = [];
    this._save();
    return true;
  }

  /**
   * Create a unique index on a field
   * Convenience method for creating unique indexes
   * @param {string} field - Field name to create unique index on
   * @param {object} options - Additional index options (sparse)
   * @returns {boolean} Success status
   */
  createUniqueIndex(field, options = {}) {
    return this.db.createIndex(this.name, field, { ...options, unique: true });
  }

  /**
   * Create an index on a field
   * @param {string} field - Field name to create index on
   * @param {object} options - Index options (unique, sparse)
   * @returns {boolean} Success status
   */
  createIndex(field, options = {}) {
    return this.db.createIndex(this.name, field, options);
  }

  /**
   * Check if document matches query
   * @private
   */
  _matchesQuery(doc, query) {
    for (const [key, value] of Object.entries(query)) {
      if (key.startsWith('$')) continue; // Skip operators

      if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
        // Handle query operators
        if (value.$eq !== undefined && doc[key] !== value.$eq) return false;
        if (value.$ne !== undefined && doc[key] === value.$ne) return false;
        if (value.$gt !== undefined && doc[key] <= value.$gt) return false;
        if (value.$gte !== undefined && doc[key] < value.$gte) return false;
        if (value.$lt !== undefined && doc[key] >= value.$lt) return false;
        if (value.$lte !== undefined && doc[key] > value.$lte) return false;
        if (value.$in !== undefined && !value.$in.includes(doc[key])) return false;
        if (value.$nin !== undefined && value.$nin.includes(doc[key])) return false;
        if (value.$regex !== undefined) {
          const regex = new RegExp(value.$regex, value.$options || '');
          if (!regex.test(doc[key])) return false;
        }
      } else if (Array.isArray(value)) {
        if (!value.includes(doc[key])) return false;
      } else {
        if (doc[key] !== value) return false;
      }
    }
    return true;
  }

  /**
   * Sort documents
   * @private
   */
  _sort(documents, sortSpec) {
    return documents.sort((a, b) => {
      for (const [field, direction] of Object.entries(sortSpec)) {
        const aVal = a[field];
        const bVal = b[field];
        const multiplier = direction === -1 || direction === 'desc' ? -1 : 1;

        if (aVal < bVal) return -1 * multiplier;
        if (aVal > bVal) return 1 * multiplier;
      }
      return 0;
    });
  }

  /**
   * Apply projection to document
   * @private
   */
  _applyProjection(doc, projection) {
    const projected = {};
    for (const [field, include] of Object.entries(projection)) {
      if (include !== 0 && include !== false) {
        if (field === '_id' || doc.hasOwnProperty(field)) {
          projected[field] = doc[field];
        }
      }
    }
    return projected;
  }

  /**
   * Generate unique ID
   * @private
   */
  _generateId() {
    return `_${Date.now()}_${this._nextId++}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Validate unique indexes before insert
   * @private
   */
  _validateUniqueIndexes(document) {
    const collectionIndexes = this.db.indexes.get(this.name);
    if (!collectionIndexes) return;

    collectionIndexes.forEach((index, field) => {
      if (index.unique && document[field] !== undefined) {
        if (index.values.has(document[field])) {
          throw new Error(`Duplicate key error: ${field} must be unique`);
        }
      }
    });
  }

  /**
   * Validate unique indexes before update
   * @private
   */
  _validateUniqueIndexesOnUpdate(document, documentId) {
    const collectionIndexes = this.db.indexes.get(this.name);
    if (!collectionIndexes) return;

    collectionIndexes.forEach((index, field) => {
      if (index.unique && document[field] !== undefined) {
        if (index.values.has(document[field])) {
          // Check if the value belongs to this document or another one
          const documentIds = index.values.get(document[field]);
          if (!documentIds.includes(documentId)) {
            throw new Error(`Duplicate key error: ${field} must be unique`);
          }
        }
      }
    });
  }

  /**
   * Update indexes when document changes
   * @private
   */
  _updateIndexes(document, operation) {
    const collectionIndexes = this.db.indexes.get(this.name);
    if (!collectionIndexes) return;

    collectionIndexes.forEach((index, field) => {
      if (operation === 'delete') {
        // Remove document ID from all index values
        index.values.forEach((ids, value) => {
          const pos = ids.indexOf(document._id);
          if (pos !== -1) {
            ids.splice(pos, 1);
            if (ids.length === 0) {
              index.values.delete(value);
            }
          }
        });
      } else {
        // Insert or update: add/update index entry
        if (document[field] !== undefined) {
          const value = document[field];
          if (!index.values.has(value)) {
            index.values.set(value, []);
          }
          if (!index.values.get(value).includes(document._id)) {
            index.values.get(value).push(document._id);
          }
        }
      }
    });
  }

  /**
   * Load documents from disk
   * @private
   */
  _load() {
    if (fs.existsSync(this.filePath)) {
      try {
        const data = fs.readFileSync(this.filePath, 'utf8');
        this.documents = JSON.parse(data);
        // Set next ID based on existing documents
        if (this.documents.length > 0) {
          const lastId = this.documents[this.documents.length - 1]._id;
          this._nextId = parseInt(lastId.split('_')[1]) + 1000 || this.documents.length + 1;
        }
      } catch (error) {
        console.error(`Error loading collection ${this.name}:`, error.message);
        this.documents = [];
      }
    }
  }

  /**
   * Save documents to disk
   * @private
   */
  _save() {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.documents, null, 2));
    } catch (error) {
      console.error(`Error saving collection ${this.name}:`, error.message);
      throw error;
    }
  }
}

// Export the database class
module.exports = NoSQLite;


const fs = require('fs');
const path = require('path');
const dbConfig = require('../config/db');

const getDbPath = () => path.join(__dirname, '../data/local_db.json');

// Read local JSON file
const readLocalDB = () => {
  try {
    const data = fs.readFileSync(getDbPath(), 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading local DB:', err);
    return { users: [], officers: [], complaints: [], notifications: [], chatHistories: [] };
  }
};

// Write local JSON file
const writeLocalDB = (data) => {
  try {
    fs.writeFileSync(getDbPath(), JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing local DB:', err);
  }
};

// Helper to generate IDs
const generateId = () => '_' + Math.random().toString(36).substr(2, 9);

// Simple query matcher for local JSON records
const matchQuery = (item, query) => {
  if (!query) return true;
  for (const key in query) {
    if (query[key] === undefined) continue;
    
    // Support basic $or or regex or other mongoose operators if needed, or simple equality
    if (key === '$or' && Array.isArray(query[key])) {
      const orMatches = query[key].some(subQuery => matchQuery(item, subQuery));
      if (!orMatches) return false;
      continue;
    }

    if (item[key] !== query[key]) {
      // Basic support for string case-insensitive matching
      if (typeof query[key] === 'string' && typeof item[key] === 'string') {
        if (query[key].toLowerCase() === item[key].toLowerCase()) {
          continue;
        }
      }
      return false;
    }
  }
  return true;
};

// The wrapper class that mirrors standard Mongoose actions
class ModelWrapper {
  constructor(collectionName, mongooseModel) {
    this.collectionName = collectionName; // e.g. 'users', 'complaints'
    this.mongooseModel = mongooseModel;   // mongoose Model class
  }

  async find(query = {}) {
    if (!global.useLocalDB) {
      return await this.mongooseModel.find(query);
    }
    const db = readLocalDB();
    const list = db[this.collectionName] || [];
    return list.filter(item => matchQuery(item, query));
  }

  async findOne(query = {}) {
    if (!global.useLocalDB) {
      return await this.mongooseModel.findOne(query);
    }
    const db = readLocalDB();
    const list = db[this.collectionName] || [];
    return list.find(item => matchQuery(item, query)) || null;
  }

  async findById(id) {
    if (!global.useLocalDB) {
      return await this.mongooseModel.findById(id);
    }
    const db = readLocalDB();
    const list = db[this.collectionName] || [];
    return list.find(item => item._id === id) || null;
  }

  async create(data) {
    if (!global.useLocalDB) {
      return await this.mongooseModel.create(data);
    }
    const db = readLocalDB();
    if (!db[this.collectionName]) db[this.collectionName] = [];
    
    const newRecord = {
      _id: data._id || generateId(),
      ...data,
      createdAt: data.createdAt || new Date().toISOString()
    };
    
    db[this.collectionName].push(newRecord);
    writeLocalDB(db);
    return newRecord;
  }

  async findByIdAndUpdate(id, update, options = {}) {
    if (!global.useLocalDB) {
      return await this.mongooseModel.findByIdAndUpdate(id, update, { new: true, ...options });
    }
    const db = readLocalDB();
    const list = db[this.collectionName] || [];
    const index = list.findIndex(item => item._id === id);
    if (index === -1) return null;

    let doc = list[index];
    const updateObj = update.$set || update; // simple support for mongoose $set
    
    list[index] = {
      ...doc,
      ...updateObj,
      updatedAt: new Date().toISOString()
    };

    // Support pushing elements to nested arrays (like complaint timeline or progress photos)
    if (update.$push) {
      for (const arrayKey in update.$push) {
        if (!list[index][arrayKey]) list[index][arrayKey] = [];
        const pushVal = update.$push[arrayKey];
        if (pushVal && typeof pushVal === 'object' && pushVal.$each && Array.isArray(pushVal.$each)) {
          list[index][arrayKey].push(...pushVal.$each);
        } else {
          list[index][arrayKey].push(pushVal);
        }
      }
    }

    writeLocalDB(db);
    return list[index];
  }

  async updateOne(query, update) {
    if (!global.useLocalDB) {
      return await this.mongooseModel.updateOne(query, update);
    }
    const db = readLocalDB();
    const list = db[this.collectionName] || [];
    const index = list.findIndex(item => matchQuery(item, query));
    if (index === -1) return { nModified: 0 };

    let doc = list[index];
    const updateObj = update.$set || update;
    list[index] = { ...doc, ...updateObj };
    writeLocalDB(db);
    return { nModified: 1 };
  }

  async countDocuments(query = {}) {
    if (!global.useLocalDB) {
      return await this.mongooseModel.countDocuments(query);
    }
    const db = readLocalDB();
    const list = db[this.collectionName] || [];
    return list.filter(item => matchQuery(item, query)).length;
  }
}

module.exports = ModelWrapper;

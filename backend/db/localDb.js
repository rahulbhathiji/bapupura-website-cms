const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Simple ID Generator
function generateId() {
  return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
}

class LocalModel {
  constructor(name) {
    this.name = name;
    this.filePath = path.join(DATA_DIR, `${name.toLowerCase()}.json`);
    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, JSON.stringify([], null, 2));
    }
  }

  _read() {
    try {
      if (!fs.existsSync(this.filePath)) {
        return [];
      }
      const data = fs.readFileSync(this.filePath, 'utf8');
      return JSON.parse(data || '[]');
    } catch (e) {
      console.error(`Error reading database file for ${this.name}:`, e);
      return [];
    }
  }

  _write(data) {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2));
    } catch (e) {
      console.error(`Error writing database file for ${this.name}:`, e);
    }
  }

  async find(query = {}) {
    const records = this._read();
    return records.filter(item => {
      for (const key in query) {
        // Simple equal match
        if (query[key] !== undefined && item[key] !== query[key]) {
          return false;
        }
      }
      return true;
    }).map(r => this._toDoc(r));
  }

  async findOne(query = {}) {
    const records = this._read();
    const found = records.find(item => {
      for (const key in query) {
        if (query[key] !== undefined && item[key] !== query[key]) {
          return false;
        }
      }
      return true;
    });
    return found ? this._toDoc(found) : null;
  }

  async findById(id) {
    const records = this._read();
    const found = records.find(item => item._id === id || item.id === id);
    return found ? this._toDoc(found) : null;
  }

  async create(docData) {
    const records = this._read();
    const now = new Date().toISOString();
    const newDoc = {
      _id: generateId(),
      ...docData,
      createdAt: now,
      updatedAt: now
    };
    records.push(newDoc);
    this._write(records);
    return this._toDoc(newDoc);
  }

  async findByIdAndUpdate(id, update, options = {}) {
    const records = this._read();
    const index = records.findIndex(item => item._id === id || item.id === id);
    if (index === -1) return null;

    const now = new Date().toISOString();
    const updatedRecord = {
      ...records[index],
      ...update,
      updatedAt: now
    };

    records[index] = updatedRecord;
    this._write(records);
    return this._toDoc(updatedRecord);
  }

  async findByIdAndDelete(id) {
    const records = this._read();
    const index = records.findIndex(item => item._id === id || item.id === id);
    if (index === -1) return null;

    const deleted = records.splice(index, 1)[0];
    this._write(records);
    return this._toDoc(deleted);
  }

  async countDocuments(query = {}) {
    const records = this._read();
    return records.filter(item => {
      for (const key in query) {
        if (query[key] !== undefined && item[key] !== query[key]) {
          return false;
        }
      }
      return true;
    }).length;
  }

  _toDoc(record) {
    if (!record) return null;
    return {
      ...record,
      id: record._id,
      toObject: function() {
        const { toObject, ...rest } = this;
        return rest;
      },
      save: async function() {
        // Mimic mongoose save. In our local DB, updates are written via findByIdAndUpdate
        return this;
      }
    };
  }
}

module.exports = {
  model: (name) => new LocalModel(name)
};

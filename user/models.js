const mongoose = require('mongoose');
const path = require('path');

const FETCH_MODEL = (name, db = false) => {
  const { Schema } = mongoose;
  const model = require(path.resolve(__dirname + '/../models/', name + '.js'));

  try {
    if (typeof model === 'function') {
      const db_conn_check = ['international-digital-dollar-db'];
      const { schema, collection } = model(mongoose);

      if (name !== collection) {
        throw new Error(`ERROR : NAME OF MODAL IS ${name} in schema its :${collection}`);
      }

      const modelSchema = new Schema(schema, {
        collection,
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
      });

      if (db && db_conn_check.includes(db)) {
        const DB_CONN = mongoose.connection.useDb(db);
        return DB_CONN.model(name, modelSchema);
      }

      return mongoose.model(name, modelSchema);
    } else {
      throw new Error(`ERROR : MISSING MODEL FOR SCHEMA ${name}`);
    }
  } catch (err) {
    console.error('ERROR: ', err);
  }
};

global.USER = FETCH_MODEL('user');
global.USER_JWT = FETCH_MODEL('user_jwt');
global.SUPPORT_QUERY = FETCH_MODEL('support_query');
global.TRANSACTIONS = FETCH_MODEL('transactions');


const { Pool } = require("pg");

let client = null;

const dbConfig = {
  host: process.env.ndviWorkerDbHost,
  port: process.env.ndviWorkerDbPort,
  database: "postgres",
  user: process.env.ndviWorkerDbUser,
  password: process.env.ndviWorkerDbPassword,
  ssl: {
    rejectUnauthorized: false,
  },
};

const dbName = process.env.ndviWorkerDbDatabase;

const setConnection = async (dbConfig, dbName = null) => {
  if (dbName) {
    dbConfig.database = dbName;
  }

  let client = null;

  try {
    const pool = new Pool(dbConfig);

console.log(dbConfig);

    client = await pool.connect();
    return client;
  } catch (error) {
    console.error("ERROR in connection: ", error.message);
    return null;
  }
};

const setUser = async (companyId,startdate) => {
  try {
    const checkQuery = "SELECT * FROM users WHERE companyId = $1";
    const { rows } = await client.query(checkQuery, [companyId]);

    if (rows.length > 0) {
      console.log("A user with the same companyId already exists.");
      return false;
    }

    const insertQuery = `
        INSERT INTO users (companyId,startdate)
        VALUES ($1,$2)        
      `;

    const result = await client.query(insertQuery, [companyId,startdate]);
    if (result.rows.length > 0) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.error("Error: ", error.message);
    return false;
  }
};

const getAllUsers = async (columns) => {
  try {
    const selectColumns = columns.join(", ");
    const selectQuery = `SELECT ${selectColumns} FROM users`;

    const { rows } = await client.query(selectQuery);

    if (rows.length > 0) {
      return rows;
    } else {
      return null;
    }
  } catch (error) {
    console.log("Error: ", error.message);
    return null;
  }
};

const getUser = async (companyId) => {
  try {
    const checkQuery = "SELECT * FROM users WHERE companyId = $1";
    const { rows } = await client.query(checkQuery, [companyId]);

    if (rows.length > 0) {
      return rows[0];
    } else {
      return null;
    }
  } catch (error) {
    console.log("Error: ", error.message);
    return null;
  }
};

const userStatus = async (companyId) => {
  try {
    const checkQuery = "SELECT * FROM users WHERE companyId = $1";
    const { rows } = await client.query(checkQuery, [companyId]);

    if (rows.length > 0) {
      const ret = {
        status: rows[0].ready,
        currentWorkarea: rows[0].currentworkarea,
        workareaCount: rows[0].workareacount,
      };

      return ret;
    } else {
      return null;
    }
  } catch (error) {
    console.log("Error: ", error.message);
    return null;
  }
};

const updateUser = async (data) => {
  try {
    const updateQuery = `
      UPDATE users
      SET enddate = $2,
          elapsedtime = $3, 
          geometry = $4,
          currentWorkarea = $5,
          workareaCount = $6,
          ready = $7
      WHERE companyId = $1      
    `;

    const result = await client.query(updateQuery, data);

    if (result.rows.length > 0) {
      return result.rows[0];
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error: ", error.message);
    return null;
  }
};

const setImage = async (data) => {
  try {
    const checkQuery = `SELECT id FROM images WHERE id = '${data.id}'`;

    const { rows } = await client.query(checkQuery);

    if (rows.length === 0) {
      const insertQuery = `
      INSERT INTO images (id, average, max, min, image, scale)
      VALUES ($1, $2, $3, $4, $5, $6)
    `;

      await client.query(insertQuery, [
        data.id,
        data.average,
        data.max,
        data.min,
        data.image,
        data.scale,
      ]);

      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.log("Error: ", error.message);
    return false;
  }
};

const getImage = async (id) => {
  try {
    const selectQuery = `SELECT * FROM images WHERE id = '${id}'`;
    const { rows } = await client.query(selectQuery);
    return rows[0];
  } catch (error) {
    console.error("Error: ", error.message);
    return null;
  }
};

const deleteImage = async (id) => {
  try {
    const checkQuery = `SELECT id FROM images WHERE id = '${id}'`;
    const { rows } = await client.query(checkQuery);

    if (rows.length === 0) {
      console.log(`Image with ID ${id} does not exist.`);
      return false;
    }

    const deleteQuery = `DELETE FROM images WHERE id = '${id}' RETURNING *`;
    const { rowCount } = await client.query(deleteQuery);

    if (rowCount === 1) {
      console.log(`Image with ID ${id} has been deleted.`);
      return true;
    } else {
      console.log(`Failed to delete image with ID ${id}.`);
      return false;
    }
  } catch (error) {
    console.error("Err: ", error.message);
    return false;
  }
};

const setDates = async (data) => {
  try {
    const checkQuery = `SELECT id FROM dates WHERE id = '${data.id}'`;

    const { rows } = await client.query(checkQuery);

    if (rows.length === 0) {
      const insertQuery = `
      INSERT INTO dates (id, area, dates)
      VALUES ($1, $2, $3)
    `;

      await client.query(insertQuery, [data.id, data.area, data.dates]);

      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.log("Error: ", error.message);
    return false;
  }
};

const updateDates = async (data) => {
  try {
    const updateQuery = `
      UPDATE dates
      SET dates = $2
      WHERE id = $1
    `;

    const checkQuery = `SELECT id FROM dates WHERE id = '${data.id}'`;

    const { rows } = await client.query(checkQuery);

    if (rows.length === 0) {
      return false;
    } else {
      const result = await client.query(updateQuery, [data.id, data.dates]);

      if (result.rowCount === 0) {
        return false;
      } else {
        return true;
      }
    }
  } catch (error) {
    console.log("Error: ", error.message);
    return false;
  }
};

const deleteDates = async (id) => {
  try {
    const deleteQuery = `
      DELETE FROM dates
      WHERE id = $1
    `;
    const result = await client.query(deleteQuery, [id]);

    if (result.rowCount === 1) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.log("Error: ", error.message);
    return false;
  }
};

const getDates = async (id) => {
  try {
    const selectQuery = `SELECT * FROM dates WHERE id = '${id}'`;
    const { rows } = await client.query(selectQuery);

    return rows[0];
  } catch (error) {
    console.error("Error: ", error.message);
    return null;
  }
};

//***************************************************************************

const ifDbExists = async (dbName) => {
  try {
    const checkDatabaseQuery = `SELECT datname FROM pg_database WHERE datname = $1`;
    const result = await client.query(checkDatabaseQuery, [dbName]);

    return result.rows.length > 0;
  } catch (error) {
    console.error("Error: ", error.message);
  }
};

const createDb = async (dbName) => {
  try {
    if (!(await ifDbExists(dbName))) {
      const createDatabaseQuery = `CREATE DATABASE ${dbName}`;

      await client.query(createDatabaseQuery);
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.error("Error: ", error.message);
    return false;
  } finally {
  }
};

const ifTableExists = async (tableName) => {
  const checkTableQuery = `SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = $1)`;

  try {
    const result = await client.query(checkTableQuery, [tableName]);
    return result.rows[0].exists;
  } catch (error) {
    console.error("Error: ", error.message);
    return null;
  }
};

const deleteDb = async (dbName) => {
  try {
    const deleteDatabaseQuery = `DROP DATABASE IF EXISTS ${dbName}`;
    await client.query(deleteDatabaseQuery);
    return true;
  } catch (error) {
    console.error("Error: ", error.message);
    return false;
  }
};

const createTable = async (tableName, schema, indexColumn) => {
  try {
    if (!(await ifTableExists(tableName))) {
      const createTableQuery = `
      CREATE TABLE IF NOT EXISTS ${tableName} (${schema});
      CREATE INDEX ON ${tableName} (${indexColumn});    
  `;

      await client.query(createTableQuery);
      console.log("Created table ", tableName);
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.error("Error: ", error.message);
    return false;
  }
};

const setup = async () => {
  client = await setConnection(dbConfig);

  if (client) {
    await createDb(dbName);
    client = await setConnection(dbConfig, dbName);

    const datesSchema = require("./schemas/dates");
    const imagesSchema = require("./schemas/images");
    const usersSchema = require("./schemas/users");

    await createTable("dates", datesSchema, "id");
    await createTable("images", imagesSchema, "id");
    await createTable("users", usersSchema, "companyid");

    //console.log("Azure postgre setup done.");
  } else {
    console.error("ERROR: yhteydessä ongelmia");
  }
};

setup();

module.exports = {
  setup,
  setUser,
  updateUser,
  userStatus,
  setDates,
  updateDates,
  deleteDates,
  getDates,
  setImage,
  getImage,
  deleteImage,
  deleteDb,
  getUser,
  getAllUsers,
};

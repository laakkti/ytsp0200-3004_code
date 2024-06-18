const datesSchema = `
  _id serial PRIMARY KEY,
  id VARCHAR(255) UNIQUE,
  area REAL,
  dates JSONB[] 
`;

module.exports = datesSchema;

const usersSchema = `
  _id serial PRIMARY KEY,
  startDate VARCHAR(255),
  endDate VARCHAR(255),
  elapsedTime NUMERIC DEFAULT 0, 
  companyId VARCHAR(255) UNIQUE NOT NULL,
  geometry JSONB[],
  currentWorkarea INTEGER DEFAULT 0,
  workareaCount INTEGER DEFAULT 0,
  ready BOOLEAN DEFAULT false  
`;

module.exports = usersSchema;

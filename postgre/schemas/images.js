const imagesSchema = `
  _id serial PRIMARY KEY,
  id VARCHAR(255) ,
  average REAL,
  max REAL,
  min REAL,
  image JSONB,
  scale JSONB[]  
`;

module.exports = imagesSchema;

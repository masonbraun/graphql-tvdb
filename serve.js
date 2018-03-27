const express = require('express');
const graphqlHTTP = require('express-graphql');
var morgan = require('morgan');

const app = express();
const schema = require('./schema');

// app.use(morgan('combined'));

app.use(
  '/graphql',
  graphqlHTTP({
    schema,
    graphiql: true
  })
);

app.listen(4546);
console.log('Listening...');

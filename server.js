const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const { express: voyagerMiddleware } = require('graphql-voyager/middleware');
const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const { makeExecutableSchema } = require('@graphql-tools/schema');

const app = express();
const port = 13000;

// 1. Schema management with caching
let currentSchema = null;
let schemaVersion = 0;

const loadSchemaFiles = () => {
  const schemaDir = path.join(__dirname, 'schema');
  return fs.readdirSync(schemaDir)
    .filter(file => file.endsWith('.graphql'))
    .map(file => fs.readFileSync(path.join(schemaDir, file), 'utf8'))
    .join('\n');
};

const updateSchema = () => {
  try {
    currentSchema = makeExecutableSchema({
      typeDefs: loadSchemaFiles(),
      resolverValidationOptions: {
        requireResolversForArgs: false,
        requireResolversForNonScalar: false
      }
    });
    schemaVersion++;
    console.log(`\n🔁 Schema updated (version ${schemaVersion})`);
    return true;
  } catch (error) {
    console.error('❌ Schema update failed:', error.message);
    return false;
  }
};

// 2. File watcher setup
const watcher = chokidar.watch('./schema/**/*.graphql', {
  ignored: /(^|[\/\\])\../,
  persistent: true,
  ignoreInitial: true
});

// Debounce function to prevent multiple reloads
const debounce = (func, wait = 500) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

watcher.on('all', debounce((event, path) => {
  console.log(`\n📁 Detected change in: ${path}`);
  if (updateSchema()) {
    // Notify connected clients
    app.locals.schemaVersion = schemaVersion;
  }
}));

// 3. Dynamic GraphQL endpoint
app.use('/graphql', (req, res) => {
  if (!currentSchema) {
    return res.status(503).send('Schema not loaded');
  }
  return graphqlHTTP({
    schema: currentSchema,
    graphiql: true,
    context: { schemaVersion }
  })(req, res);
});

// 4. Voyager with auto-refresh
app.use('/voyager', voyagerMiddleware({
  endpointUrl: '/graphql',
  displayOptions: {
    reloadButton: true,
    pollInterval: 3000 // Check for schema changes every 3 seconds
  }
}));

// 5. Initial setup
updateSchema();
app.listen(port, () => {
  console.log(`🚀 Server ready at http://localhost:${port}
🔍 Voyager UI: http://localhost:${port}/voyager`);
});

// Handle cleanup
process.on('SIGINT', () => {
  watcher.close();
  process.exit();
});

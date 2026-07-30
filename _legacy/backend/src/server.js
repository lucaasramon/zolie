const { app } = require('./app');
const { env } = require('./config/env');

app.listen(env.port, () => {
  console.log('Zoliê API em http://localhost:' + env.port + env.apiPrefix);
  console.log('Fonte de dados: ' + env.dataSource + (env.dataSource === 'mock' ? ' (em memória — veja README para ligar o Postgres)' : ''));
});

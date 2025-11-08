const Hapi = require('@hapi/hapi');
const routes = require('./routes');

const init = async () => {
  const server = Hapi.server({
    port: 5000,
    host: 'localhost',
    routes: {
      cors: {
        origin: ['*']
      }
    }
  });

  server.route(routes);

  // Tambahkan handler global untuk error log
  server.ext('onPreResponse', (request, h) => {
    const response = request.response;
    if (response.isBoom) {
      console.error('ERROR:', response);
    }
    return h.continue;
  });

  await server.start();
  console.log(`Server running on ${server.info.uri}`);
};

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});

init();

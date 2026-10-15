import createApp from './app.js';
import { PORT, NODE_ENV } from './config/env.js';

const app = createApp();

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${NODE_ENV} mode`);
});

export default server;

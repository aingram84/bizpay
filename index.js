const server = require('./API/server.js');

const port = process.env.PORT || 5001;
server.listen(port, () => {
  console.log(`\n--> BizPay is running on port ${port} <--\n`);
})
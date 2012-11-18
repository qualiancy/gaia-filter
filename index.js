module.exports = process.env.filter_COV
  ? require('./lib-cov/filter')
  : require('./lib/filter');

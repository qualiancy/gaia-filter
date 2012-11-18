/*!
 * gaia-filter : MongoDB style array filtering
 * Copyright(c) 2011 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */

/*!
 * Module dependancies
 */

var properties = require('tea-properties');

/*!
 * Constants
 */

var TRAVERSABLE = {
    $and: true
  , $or: true
  , $nor: true
};

/*!
 * Primary Exports
 */

module.exports = Filter;

/**
 * ### filter (query)
 *
 * The primary export is a function that will memoize a query
 * so that it can be used to filter many arrays. Furthermore,
 * there are several methods to adjust the output of the result
 * set.
 *
 * The filter query language is similiar MongoDB's query language
 * in that it allows for nested statements, deep object property
 * detection, and conditionals such as `$and`, `$or`, and `$nor`.
 *
 * ```js
 * var filter = require('gaia-filter');
 *
 * var dataComplex = [
 *     { a: { b: 100 }
 *     , c: 'testC'
 *     , d:
 *       [ { e: 'world' } ]
 *    }
 *  , { a: { b: 50 }
 *    , c: 'testC'
 *    , d:
 *      [ { e: 'universe' }
 *      , { e: 'galaxy' } ]
 *    }
 * ];
 *
 * var query1 = filter({ 'a.b': { $and: [ { $gt: 75 }, { $lt: 125 } ] }});
 *   , query2 = filter({ 'a.b': { $gt: 25, $lt: 75 }, 'd[0].e': { $eq: 'universe' } });
 *
 * var res1 = query1.subset(dataComplex)  // result array will have the first item
 *   , res2 = query1.subset(dataComplex); // result array will have the second item
 * ```
 *
 * Filter allows for some flexibility when composing queries by making assumptions
 * based on sane defaults.
 *
 * When a comparator is omitted when comparing a value, it assumes `$eq`.
 *
 * ```js
 * // the following are the same.
 * filter({ hello: { $eq: 'universe' } });
 * filter({ hello: 'universe' });
 * ```
 *
 * When multiple statements are listed, it assumes `$and`.
 *
 * ```js
 * // the following are the same.
 * filter({ $and: [ { hello: { $gt: 42 } }, { hello: { $lt: 84 } } ] });
 * filter({ hello: { $and: [ { $gt: 42 }, { $lt: 84 } ] } });
 * filter({ hello: { $gt: 42, $lt: 84 } });
 * ```
 *
 * @param {Object} query
 * @return filter
 * @api public
 */

function Filter (query) {
  if (!(this instanceof Filter)) {
    return new Filter(query);
  }

  this.query = query;
  this.stack = parseQuery(query);
}

/**
 * ### .test (data)
 *
 * Test a single data point against the query. Will return a
 * boolean indicating whether data passes query criteria.
 *
 * ```js
 * var query = filter({ hello: { $eq: 'universe' }})
 *   , pass = query.test({ hello: 'universe' });
 *
 * pass.should.be.true;
 * ```
 *
 * @param {Mixed} data
 * @return {Boolean} result
 */

Filter.prototype.test = function (data, opts) {
  return testFilter(data, this.stack);
};

/**
 * ### .subset (data)
 *
 * Test an array of data points against the query. Will return
 * an array of all data points that pass the query criteria.
 *
 * ```js
 * var query = { $or : [ { 'hello': true }, { 'universe': true } ] }
 *   , q = filter(query)
 *   , result = q.subset([
 *       { hello: true }
 *     , { universe: false }
 *     , { hello: false, universe: true }
 *     , { hello: false, universe: false }
 *   ]);
 *
 * result.should
 *   .be.an('array')
 *   .and.have.length(2)
 *   .and.deep.equal([
 *       { hello: true }
 *     , { hello: false, universe: true }
 *   ]);
 * ```
 *
 * @param {Array} data
 * @return {Array} result
 */

Filter.prototype.subset = function (data) {
  var res = []
    , datum;

  for (var di = 0; di < data.length; di++) {
    datum = data[di];
    if (testFilter(datum, this.stack)) res.push(datum);
  }

  return res;
};

/**
 * ### .pass (data)
 *
 * Test an array of data points against the query. Will return
 * an array of boolean in the order of the original array that
 * indicate if the data at that index passed the query criteria.
 *
 * ```js
 * var query = { $or : [ { 'hello': true }, { 'universe': true } ] }
 *   , q = filter(query)
 *   , results= q.pass([
 *         { hello: true }
 *       , { universe: false }
 *       , { hello: false, universe: true }
 *       , { hello: false, universe: false }
 *     ]);
 *
 * result.should
 *   .be.an('array')
 *   .and.have.length(4)
 *   .and.deep.equal([
 *      true
 *    , false
 *    , true
 *    , false
 *  ]);
 * ```
 *
 * @param {Array} data
 * @return {Array} result
 */

Filter.prototype.pass = function (data) {
  var res = []
    , datum;

  for (var di = 0; di < data.length; di++) {
    datum = data[di];
    res.push(testFilter(datum, this.stack));
  }

  return res;
};

/**
 * ### .index (data)
 *
 * Test an array of data points against the query. Will return
 * an array of numbers indicating the indexes of the original
 * array that passed the query criteria.
 *
 * ```js
 * var query = { $or : [ { 'hello': true }, { 'universe': true } ] }
 *   , q = filter(query)
 *   , result = q.index([
 *         { hello: true }
 *       , { universe: false }
 *       , { hello: false, universe: true }
 *       , { hello: false, universe: false }
 *     ]);
 *
 * result.should
 *   .be.an('array')
 *   .and.have.length(2)
 *   .and.deep.equal([ 0, 2 ]);
 * ```
 *
 * @param {Array} data
 * @return {Array} result
 */

Filter.prototype.index = function (data) {
  var res = []
    , datum;

  for (var di = 0; di < data.length; di++) {
    datum = data[di];
    if (testFilter(datum, this.stack)) res.push(di);
  }

  return res;
};

/**
 * ### .comparators
 *
 * The following are the comparators implemented
 * for use as part of a query. They can also be used
 * for simple comparation, such as `filter.$eq(2,2)` which
 * would return `true`.
 */

Filter.comparators = {

    /**
     * #### .$gt (a, b)
     *
     * Assert `a` is greater than `b`.
     *
     * @param {Number} a
     * @param {Number} b
     * @return {Boolean}
     * @api public
     */

    $gt: function (a, b) {
      return a > b;
    }

    /**
     * #### .$gte (a, b)
     *
     * Assert `a` is greater than or equal to `b`.
     *
     * @param {Number} a
     * @param {Number} b
     * @return {Boolean}
     * @api public
     */

  , $gte: function (a, b) {
      return a >= b;
    }

    /**
     * #### .$lt (a, b)
     *
     * Assert `a` is less than `b`.
     *
     * @param {Number} a
     * @param {Number} b
     * @return {Boolean}
     * @api public
     */

  , $lt: function (a, b) {
      return a < b;
    }

    /**
     * #### .$lte (a, b)
     *
     * Assert `a` is less than or equal to `b`.
     *
     * @param {Number} a
     * @param {Number} b
     * @return {Boolean}
     * @api public
     */

  , $lte: function (a, b) {
      return a <= b;
    }

    /**
     * #### .$all (a, b)
     *
     * Assert `a` contains at least all items in `b`.
     *
     * @param {Array} a
     * @param {Array} b
     * @return {Boolean}
     * @api public
     */

  , $all: function (a, b) {
      for (var i = 0; i < b.length; i++) {
        if (!~a.indexOf(b[i])) return false;
      }
      return true;
    }

    /**
     * #### .$exists (a, b)
     *
     * Assert truthiness of `a` equals `b`.
     *
     * @param {Mixed} a
     * @param {Boolean} b
     * @return {Boolean}
     * @api public
     */

  , $exists: function (a, b) {
      return !!a == b;
    }

    /**
     * #### .$mod (a, b)
     *
     * Assert `a` mod (`%`) `b[0]` equals `b[1]`.
     *
     * @param {Number} a
     * @param {Array} b
     * @return {Boolean}
     * @api public
     */

  , $mod: function (a, b) {
      return a % b[0] == b[1];
    }

    /**
     * #### .$eq (a, b)
     *
     * Assert `a` equals (`===`) `b`.
     *
     * @param {Mixed} a
     * @param {Mixed} b
     * @return {Boolean}
     * @api public
     */

  , $eq: function (a, b) {
      return a === b;
    }

    /**
     * #### .$eq (a, b)
     *
     * Assert `a` does not equal (`!==`) `b`.
     *
     * @param {Mixed} a
     * @param {Mixed} b
     * @return {Boolean}
     * @api public
     */

  , $ne: function (a, b) {
      return a !== b;
    }

    /**
     * #### .$in (a, b)
     *
     * Assert `a` is in `b` using `indexOf`.
     *
     * @param {Mixed} a
     * @param {Array} b
     * @return {Boolean}
     * @api public
     */

  , $in: function (a, b) {
      return ~b.indexOf(a) ? true : false;
    }

    /**
     * #### .$nin (a, b)
     *
     * Assert `a` is not in `b` using `indexOf`.
     *
     * @param {Mixed} a
     * @param {Array} b
     * @return {Boolean}
     * @api public
     */

  , $nin: function (a, b) {
      return ~b.indexOf(a) ? false : true;
    }

    /**
     * #### .$size (a, b)
     *
     * Assert `a` has length of `b`. Returns
     * `false` if `a` does not have a length.
     * property.
     *
     * @param {Mixed} a
     * @param {Number} b
     * @return {Boolean}
     * @api public
     */

  , $size: function (a, b) {
      return (a && a.length && b) ? a.length == b : false;
    }

    /**
     * #### .$or (a)
     *
     * Assert `a` has at least one truthy value.
     *
     * @param {Array} a
     * @return {Boolean}
     * @api public
     */

  , $or: function (a) {
      var res = false;
      for (var i = 0; i < a.length; i++) {
        var fn = a[i];
        if (fn) res = true;
      }
      return res;
    }

    /**
     * #### .$nor (a)
     *
     * Assert `a` has zero truthy values.
     *
     * @param {Array} a
     * @return {Boolean}
     * @api public
     */

  , $nor: function (a) {
      var res = true;
      for (var i = 0; i < a.length; i++) {
        var fn = a[i];
        if (fn) res = false;
      }
      return res;
    }

    /**
     * #### .$and (a)
     *
     * Assert `a` has all truthy values.
     *
     * @param {Array} a
     * @return {Boolean}
     * @api public
     */

  , $and: function (a) {
      var res = true;
      for (var i = 0; i < a.length; i++) {
        var fn = a[i];
        if (!fn) res = false;
      }
      return res;
    }
};

/*!
 * Given the query input, create a re-usable definition
 * for how to test data again the query.
 *
 * @param {Object} query
 * @returns {Array} stack to be used with `Filtr.prototype.test`
 */

function parseQuery (query) {
  var stack = []
    , params, qry;

  for (var cmd in query) {
    params = query[cmd];
    qry = {};

    if (cmd[0] == '$') {
      qry.test = parseFilter(query);
    } else if ('string' == typeof params
    || 'number' == typeof params
    || 'boolean' == typeof params) {
      qry.test = parseFilter({ $eq: params });
      qry.path = cmd;
    } else {
      qry.test = parseFilter(params);
      qry.path = cmd;
    }

    stack.push(qry);
  }

  return stack;
};

/*!
 * Given that the root object passed is a comparator definition,
 * return a consumable test definition.
 *
 * @param {Object} query
 * @returns {Array} stack for use as input with `testFilter`
 */

function parseFilter (query) {
  var stack = [];

  for (var test in query) {
    var fn = Filter.comparators[test]
      , params = query[test]
      , traverse = false
      , st = []
      , p, nq;

    if (TRAVERSABLE[test]) {
      traverse = true;
      for (var i = 0; i < params.length; i++) {
        p = params[i];
        if ('string' == typeof p
        ||  'number' == typeof p
        ||  'boolean' == typeof p) {
          traverse = false;
        } else {
          nq = parseQuery(p);
        }
        st.push(nq);
      }
    }

    stack.push({
        fn: fn
      , params: traverse ? st : params
      , traverse: traverse
    });
  }

  return stack;
};

/*!
 * Given a well-formed stack from `parseFilter`, test
 * a given value again the stack.
 *
 * As the value is passed to a comparator, if that comparator
 * cannot interpret the value, false will be return. IE $gt: 'hello'
 *
 * @param {Object} value for consumption by comparator test
 * @param {Array} stack from `parseFilter`
 * @return {Boolean} result
 * @api private
 */

function testFilter (val, stack) {
  var pass = true;

  for (var si = 0, sl = stack.length; si < sl; si++) {
    var filter = stack[si]
      , el = filter.path
        ? properties.get(val, filter.path)
        : val
      , res = _testFilter(el, filter.test);

    if (!res) pass = false;
  }

  return pass;
};

/*!
 * Proxy the testing to the comparator or back to `testFilter`
 * if we traversing.
 *
 * @param {Mixed} value to test
 * @param {Array} stack to iterate
 * @return {Boolean} result
 * @api private
 */

function _testFilter (val, stack) {
  var res = true;

  for (var i = 0; i < stack.length; i++) {
    var test = stack[i]
      , params = test.params
      , p = [];

    if (test.traverse) {
      for (var ii = 0; ii < params.length; ii++) {
        p.push(testFilter(val, params[ii]));
      }

      params = p;
    }

    if (test.fn.length === 1 && !test.fn(params)) res = false;
    else if (test.fn.length > 1 && !test.fn(val, params)) res = false;
  }

  return res;
};

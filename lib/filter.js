var properties = require('tea-properties');

var traversable = {
    $and: true
  , $or: true
  , $nor: true
};

module.exports = Filter;

function Filter (query) {
  if (!(this instanceof Filter)) {
    return new Filter(query);
  }

  this.query = query;
  this.stack = parseQuery(query);
}
/**
 * ## .comparators
 *
 * Object containing all query compators.
 */

Filter.comparators = {
    $gt: function (a, b) {
      return a > b;
    }

  , $gte: function (a, b) {
      return a >= b;
    }

  , $lt: function (a, b) {
      return a < b;
    }

  , $lte: function (a, b) {
      return a <= b;
    }

  , $all: function (a, b) {
      for (var i = 0; i < b.length; i++) {
        if (!~a.indexOf(b[i])) return false;
      }
      return true;
    }

  , $exists: function (a, b) {
      return !!a == b;
    }

  , $mod: function (a, b) {
      return a % b[0] == b[1];
    }

  , $eq: function (a, b) {
      return a == b;
    }

  , $ne: function (a, b) {
      return a != b;
    }

  , $in: function (a, b) {
      return ~b.indexOf(a) ? true : false;
    }

  , $nin: function (a, b) {
      return ~b.indexOf(a) ? false : true;
    }

  , $size: function (a, b) {
      return (a.length && b) ? a.length == b : false;
    }

  , $or: function (a) {
      var res = false;
      for (var i = 0; i < a.length; i++) {
        var fn = a[i];
        if (fn) res = true;
      }
      return res;
    }

  , $nor: function (a) {
      var res = true;
      for (var i = 0; i < a.length; i++) {
        var fn = a[i];
        if (fn) res = false;
      }
      return res;
    }

  , $and: function (a) {
      var res = true;
      for (var i = 0; i < a.length; i++) {
        var fn = a[i];
        if (!fn) res = false;
      }
      return res;
    }
};

/**
 * # .test(data, [options]);
 *
 * The primary testing mechanism for `Filtr` can be
 * configured to return any number of possible formats.
 *
 * ### Options
 *
 * * *type*: input modifier
 * * * `set`: (default) assert that the data provided is an array. test each item.
 * * * `single`: assert that the data provided is a single item. return boolean.
 * * *spec*: output modifer
 * * * `subset`: (default) return an array containing a subset of matched items
 * * * `boolean`: return an array of the original length with each item being a boolean when object passed or failed.
 * * * `index`: return an array of numbers matching the index of passed object in the original array
 *
 * @param {Array|Object} data to test. must be an array unless option `type: 'single'`.
 * @param {Object} options (optional)
 * @returns {Array|Boolean} result based on options
 */

Filter.prototype.test = function (data, opts) {
  return testFilter(data, this.stack);
};

Filter.prototype.subset = function (data) {
  var res = []
    , datum;

  for (var di = 0; di < data.length; di++) {
    datum = data[di];
    if (testFilter(datum, this.stack)) res.push(datum);
  }

  return res;
};

Filter.prototype.pass = function (data) {
  var res = []
    , datum;

  for (var di = 0; di < data.length; di++) {
    datum = data[di];
    res.push(testFilter(datum, this.stack));
  }

  return res;
};

Filter.prototype.index = function (data) {
  var res = []
    , datum;

  for (var di = 0; di < data.length; di++) {
    datum = data[di];
    if (testFilter(datum, this.stack)) res.push(di);
  }

  return res;
};

/*!
 * ## parseQuery(query)
 *
 * Given the query input, create a reusable definition
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
 * ## parseFilter (query)
 *
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

    if (traversable[test]) {
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
 * ## testFilter(value, stack)
 *
 * Given a well-formed stack from `parseFilter`, test
 * a given value again the stack.
 *
 * As the value is passed to a comparator, if that comparator
 * can interpret the value, false will be return. IE $gt: 'hello'
 *
 * @param {Object} value for consumption by comparator test
 * @param {Array} stack from `parseFilter`
 * @returns {Boolean} result
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

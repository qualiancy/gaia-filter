# gaia-filter [![Build Status](https://secure.travis-ci.org/qualiancy/gaia-filter.png?branch=master)](https://travis-ci.org/qualiancy/gaia-filter)

> Array filtering inspired by MongoDB's query language.

## Installation

### Node.js

`gaia-filter` is available on [npm](http://npmjs.org).

    $ npm install gaia-filter

### Component

`gaia-filter` is available as a [component](https://github.com/component/component).

    $ component install qualiancy/gaia-filter

## Usage

### filter (query)

* **@param** _{Object}_ query 
* **@return** _{filter}_  

The primary export is a function that will memoize a query
so that it can be used to filter many arrays. Furthermore,
there are several methods to adjust the output of the result
set.

The filter query language is similiar MongoDB's query language
in that it allows for nested statements, deep object property
detection, and conditionals such as `$and`, `$or`, and `$nor`.

```js
var filter = require('gaia-filter');

var dataComplex = [
    { a: { b: 100 }
    , c: 'testC'
    , d:
      [ { e: 'world' } ]
   }
 , { a: { b: 50 }
   , c: 'testC'
   , d:
     [ { e: 'universe' }
     , { e: 'galaxy' } ]
   }
];

var query1 = filter({ 'a.b': { $and: [ { $gt: 75 }, { $lt: 125 } ] }});
  , query2 = filter({ 'a.b': { $gt: 25, $lt: 75 }, 'd[0].e': { $eq: 'universe' } });

var res1 = query1.subset(dataComplex)  // result array will have the first item
  , res2 = query1.subset(dataComplex); // result array will have the second item
```

Filter allows for some flexibility when composing queries by making assumptions
based on sane defaults.

When a comparator is omitted when comparing a value, it assumes `$eq`.

```js
// the following are the same.
filter({ hello: { $eq: 'universe' } });
filter({ hello: 'universe' });
```

When multiple statements are listed, it assumes `$and`.

```js
// the following are the same.
filter({ $and: [ { hello: { $gt: 42 } }, { hello: { $lt: 84 } } ] });
filter({ hello: { $and: [ { $gt: 42 }, { $lt: 84 } ] } });
filter({ hello: { $gt: 42, $lt: 84 } });
```


### .test (data)

* **@param** _{Mixed}_ data 
* **@return** _{Boolean}_  result

Test a single data point against the query. Will return a
boolean indicating whether data passes query criteria.

```js
var query = filter({ hello: { $eq: 'universe' }})
  , pass = query.test({ hello: 'universe' });

pass.should.be.true;
```


### .subset (data)

* **@param** _{Array}_ data 
* **@return** _{Array}_  result

Test an array of data points against the query. Will return
an array of all data points that pass the query criteria.

```js
var query = { $or : [ { 'hello': true }, { 'universe': true } ] }
  , q = filter(query)
  , result = q.subset([
      { hello: true }
    , { universe: false }
    , { hello: false, universe: true }
    , { hello: false, universe: false }
  ]);

result.should
  .be.an('array')
  .and.have.length(2)
  .and.deep.equal([
      { hello: true }
    , { hello: false, universe: true }
  ]);
```


### .pass (data)

* **@param** _{Array}_ data 
* **@return** _{Array}_  result

Test an array of data points against the query. Will return
an array of boolean in the order of the original array that
indicate if the data at that index passed the query criteria.

```js
var query = { $or : [ { 'hello': true }, { 'universe': true } ] }
  , q = filter(query)
  , result = q.pass([
        { hello: true }
      , { universe: false }
      , { hello: false, universe: true }
      , { hello: false, universe: false }
    ]);

result.should
  .be.an('array')
  .and.have.length(4)
  .and.deep.equal([
      true
    , false
    , true
    , false
  ]);
```


### .index (data)

* **@param** _{Array}_ data 
* **@return** _{Array}_  result

Test an array of data points against the query. Will return
an array of numbers indicating the indexes of the original
array that passed the query criteria.

```js
var query = { $or : [ { 'hello': true }, { 'universe': true } ] }
  , q = filter(query)
  , result = q.index([
        { hello: true }
      , { universe: false }
      , { hello: false, universe: true }
      , { hello: false, universe: false }
    ]);

result.should
  .be.an('array')
  .and.have.length(2)
  .and.deep.equal([ 0, 2 ]);
```


### .comparators

The following are the comparators implemented
for use as part of a query. They can also be used
for simple comparation, such as `filter.comparators.$eq(2,2)`,
which would return `true`.

##### $gt (a, b)

* **@param** _{Number}_ a 
* **@param** _{Number}_ b 
* **@return** _{Boolean}_  

Assert `a` is greater than `b`.


##### $gte (a, b)

* **@param** _{Number}_ a 
* **@param** _{Number}_ b 
* **@return** _{Boolean}_  

Assert `a` is greater than or equal to `b`.


##### $lt (a, b)

* **@param** _{Number}_ a 
* **@param** _{Number}_ b 
* **@return** _{Boolean}_  

Assert `a` is less than `b`.


##### $lte (a, b)

* **@param** _{Number}_ a 
* **@param** _{Number}_ b 
* **@return** _{Boolean}_  

Assert `a` is less than or equal to `b`.


##### $all (a, b)

* **@param** _{Array}_ a 
* **@param** _{Array}_ b 
* **@return** _{Boolean}_  

Assert `a` contains at least all items in `b`.


##### $exists (a, b)

* **@param** _{Mixed}_ a 
* **@param** _{Boolean}_ b 
* **@return** _{Boolean}_  

Assert truthiness of `a` equals `b`.


##### $mod (a, b)

* **@param** _{Number}_ a 
* **@param** _{Array}_ b 
* **@return** _{Boolean}_  

Assert `a` mod (`%`) `b[0]` equals `b[1]`.


##### $eq (a, b)

* **@param** _{Mixed}_ a 
* **@param** _{Mixed}_ b 
* **@return** _{Boolean}_  

Assert `a` equals (`===`) `b`.


##### $eq (a, b)

* **@param** _{Mixed}_ a 
* **@param** _{Mixed}_ b 
* **@return** _{Boolean}_  

Assert `a` does not equal (`!==`) `b`.


##### $in (a, b)

* **@param** _{Mixed}_ a 
* **@param** _{Array}_ b 
* **@return** _{Boolean}_  

Assert `a` is in `b` using `indexOf`.


##### $nin (a, b)

* **@param** _{Mixed}_ a 
* **@param** _{Array}_ b 
* **@return** _{Boolean}_  

Assert `a` is not in `b` using `indexOf`.


##### $size (a, b)

* **@param** _{Mixed}_ a 
* **@param** _{Number}_ b 
* **@return** _{Boolean}_  

Assert `a` has length of `b`. Returns
`false` if `a` does not have a length.
property.


##### $or (a)

* **@param** _{Array}_ a 
* **@return** _{Boolean}_  

Assert `a` has at least one truthy value.


##### $nor (a)

* **@param** _{Array}_ a 
* **@return** _{Boolean}_  

Assert `a` has zero truthy values.


##### $and (a)

* **@param** _{Array}_ a 
* **@return** _{Boolean}_  

Assert `a` has all truthy values.

## License

(The MIT License)

Copyright (c) 2012 Jake Luer <jake@qualiancy.com> (http://qualiancy.com)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

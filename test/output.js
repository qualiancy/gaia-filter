describe('output', function () {
  describe('.test(item)', function () {
    it('should return a boolean', function () {
      var query = { $or : [ { 'hello': true }, { 'universe': true } ] }
        , q = filter(query)
        , pass = q.test({ hello: true })
        , fail = q.test({ universe: false });

      pass.should
        .be.a('boolean')
        .and.equal(true);
      fail.should
        .be.a('boolean')
        .and.equal(false);
    });
  });

  describe('.subset(arr)', function () {
    it('should return an array of matched objects', function () {
      var query = { $or : [ { 'hello': true }, { 'universe': true } ] }
        , q = filter(query)
        , pass = q.subset([
              { hello: true }
            , { universe: false }
            , { hello: false, universe: true }
            , { hello: false, universe: false }
          ]);

      pass.should
        .be.an('array')
        .and.have.length(2)
        .and.deep.equal([
            { hello: true }
          , { hello: false, universe: true }
        ]);
    });
  });

  describe('.pass(arr)', function () {
    it('should return an array of boolean match results', function () {
      var query = { $or : [ { 'hello': true }, { 'universe': true } ] }
        , q = filter(query)
        , pass = q.pass([
              { hello: true }
            , { universe: false }
            , { hello: false, universe: true }
            , { hello: false, universe: false }
          ]);

      pass.should
        .be.an('array')
        .and.have.length(4)
        .and.deep.equal([
            true
          , false
          , true
          , false
        ]);
    });
  });

  describe('.index(arr)', function () {
    it('should return an array of indexes that match', function () {
      var query = { $or : [ { 'hello': true }, { 'universe': true } ] }
        , q = filter(query)
        , pass = q.index([
              { hello: true }
            , { universe: false }
            , { hello: false, universe: true }
            , { hello: false, universe: false }
          ]);

      pass.should
        .be.an('array')
        .and.have.length(2)
        .and.deep.equal([ 0, 2 ]);
    });
  });
});

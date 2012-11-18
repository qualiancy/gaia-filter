describe('non-comparator input assumptions', function () {
  describe('string', function () {
    it('should assume $eq', function () {
      var query = { 'hello': 'universe' }
        , q = filter(query);
      q.test({ hello: 'universe' }).should.be.true;
    });
  });

  describe('number', function () {
    it('should assume $eq', function () {
      var query = { 'hello': 42 }
        , q = filter(query);
      q.test({ hello: 42 }).should.be.true;
    });
  });

  describe('boolean', function () {
    it('should assume $eq', function () {
      var query = { 'hello': true }
        , q = filter(query);
      q.test({ hello: true }).should.be.true;
    });
  });

  describe('nested', function () {
    it('should assume $eq', function () {
      var query = { $or : [ { 'hello': true }, { 'universe': true } ] }
        , q = filter(query);
      q.test({ hello: true }).should.be.true;
      q.test({ universe: true }).should.be.true;
      q.test({ hello: false, universe: true }).should.be.true;
      q.test({ hello: false, universe: false }).should.be.false;
    });
  });

  describe('multiple nested', function () {
    it('should assume $and traversal', function () {
      var query = { 'test': 'hello', world: { $in: [ 'universe' ] } }
        , q = filter(query);
      q.test({ test: 'hello', world: 'universe' }).should.be.true;
      q.test({ test: 'hello', world: 'galaxy' }).should.be.false;
    });
  });
});

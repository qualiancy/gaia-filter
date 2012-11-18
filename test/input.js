describe('input', function () {
  describe('single comparator', function () {
    it('should return correct results', function () {
      var query = { $lt: 10 }
        , q = filter(query);
      q.test(8).should.be.true;
      q.test(11).should.be.false;
    });
  });

  describe('multiple comparators', function () {
    it('should return correct results', function () {
      var query = { $lt: 10, $gt: 5 }
        , q = filter(query);
      q.test(4).should.be.false;
      q.test(8).should.be.true;
      q.test(11).should.be.false;
    });
  });

  describe('nested comparators', function () {
    it('should return correct results', function () {
      var query = { $and: [ { $size: 3 }, { $all: [ 1, 2 ] } ] }
        , q = filter(query);
      q.test([0,1,2]).should.be.true;
      q.test([0,1,2,3]).should.be.false;
    });
  });
});

/* eslint-disable */
'use strict';

var instance = require('../app');
var chai = require("chai");
var chaiHttp = require("chai-http");
var expect = chai.expect;

chai.use(chaiHttp);

describe("Health Check", function () {
  describe("When is requested the state of the service", function () {
    it("Should return a message OK", function () {
      chai
        .request(instance.server)
        .get("/health")
        .end(function (err, res) {
          expect(err).to.equal(null);
          expect(res).to.have.status(200);
          expect(res.body).to.deep.equal({ 'message': 'ok' });
        });
    });
  });
});

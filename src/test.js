var should = require('chai').should();
var assert = require('chai').assert
var https = require('https');
const axios = require('axios');

const agent = new https.Agent({  
  rejectUnauthorized: false
});

describe("Test if the website is up and running", function() {
    it("should return 200", function(done) {
        axios.get('https://localhost:3000/', {httpsAgent: agent}).then(function(response) {
	       response.status.should.equal(200);
		   done();
	}).catch(function(error) {
		   done(error);
	});
  });
});




describe("Test if REST API for searching a film", function() {
    it("should return 200", function(done) {
        axios.post('https://localhost:3000/', {
            "search": "The Great Gatsby"
		}, {httpsAgent: agent}).then(function(response) {
			response.status.should.equal(200);
			done();
		}).catch(function(error) {
			done(error);
		});
	})
});

describe("Test if REST API for getting the top ten movies on Netflix", function() {
    it("should return 200", function(done) {
        axios.get('https://localhost:3000/topMovie', {httpsAgent: agent}).then(function(response) {
			response.status.should.equal(200);
			done();
		}).catch(function(error) {
			done(error);
		});
	});
});

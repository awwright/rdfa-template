
var assert = require('assert');

describe("meta", function(){
    it("assert", function(){
        assert.throws(function(){
            throw new Error;
        });
        assert(true);
    });
})
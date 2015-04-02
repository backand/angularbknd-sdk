function addPromiseMatchers() {
	jasmine.addMatchers({
		toHaveBeenRejectedWith: function() {
	    var promise = this.actual;
	    var done = arguments[0];
	    var expectation = arguments[1];
	    return toHaveBeenRejectedWith(promise, done, expectation);
		},
		toHaveBeenResolvedWith: function() {
		    var promise = this.actual;
		    var done = arguments[0];
		    var expectation = arguments[1];
		    return toHaveBeenResolvedWith(promise, done, expectation);
		},
		toHaveBeenRejected: function() {
		    var promise = this.actual;
		    var done = arguments[0];
		    var defaultExpectation = function() {};
		    return toHaveBeenRejectedWith(promise, done, defaultExpectation);
		},
		toHaveBeenResolved: function() {
		    var promise = this.actual;
		    var done = arguments[0];
		    var defaultExpectation = function() {
		        expect(true).toBe(true);
		    };
		    return toHaveBeenResolvedWith(promise, done, defaultExpectation);
		}
	});
	function toHaveBeenRejectedWith(promise, done, expectation) {
	    promise.then(
	        function() {
	            done('Expected promise to have been rejected');
	        },
	        function(reason) {
	            try {
	                expectation(reason);
	                done();
	            } catch (ex) {
	                done(ex);
	            }
	        }
	    );
	};

	function toHaveBeenResolvedWith(promise, done, expectation) {
	    promise.then(
	        function(result) {
	            try {
	                expectation(result);
	                done();
	            } catch (ex) {
	                done(ex);
	            }
	        },
	        function() {
	            done('Expected promise to have been resolved');
	        }
	    );
	};
}

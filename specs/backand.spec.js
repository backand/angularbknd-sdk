describe('Backand', function() {
	var backandProvider;
	var backandService;
	var _token;
	var cookieStore;
	var httpBackend;
	var http;
	beforeEach(module('backand'));
	beforeEach(module('ngCookies'));
	beforeEach(module('ngMock'));

	// Must call this function first:
	function setup(options) {
		options = options || {};
		beforeEach(function() {
			// Setup cookie store mock object:
			_token = 'bearer initial_token';
			cookieStore = {
				get: jasmine.createSpy('get').and.callFake(function() {return _token}),
				put: jasmine.createSpy('put').and.callFake(function(tokenName, token) {_token = token}),
				remove: jasmine.createSpy('remove').and.callFake(function(tokenName, token) {_token = undefined})
			};
		});
		beforeEach(function() {
			// Create a fake app in order to inject the provider and configure it:
			angular.module('myApp', ['backand'])
			.constant('$cookieStore', cookieStore)
	    .config( function (BackandProvider) {
	        backandProvider = BackandProvider;
	        if (angular.isDefined(options.manageDefaultHeaders)) {
	        	BackandProvider.manageDefaultHeaders(options.manageDefaultHeaders);
	        }
	    });
	    module('myApp');
	  });

		beforeEach(inject(function(Backand, $httpBackend, $http) {
			// Inject the needed services:
			backandService = Backand;
			httpBackend = $httpBackend;
			http = $http;
		}));
		beforeEach(function() {
			// Setup http mocks for API calls:
			httpBackend.whenPOST(/\/token/).respond(function(method, url, data, headers) {
				if (/wrong/.test(data)) {
					return [500,''];
				}
				else {
					return [200,{access_token: 'my_token'}];
				}
			});
		});
	}

	describe('default configuration', function() {
		setup();
		describe('provider', function() {
		  it('should load provider', function() {
		  	expect(backandProvider).toBeDefined();
		  });
		  it('should allow to get api url', function() {
		  	expect(backandProvider.getApiUrl()).toBeDefined();
		  });
		  it('should allow to set api url', function() {
		  	backandProvider.setApiUrl("http://my.url.com");
		  	expect(backandProvider.getApiUrl()).toEqual("http://my.url.com");
		  });
		  it('setApiUrl should affect service URL', function() {
		  	backandProvider.setApiUrl("http://my.url.com");
		  	httpBackend.expectGET(/http:\/\/my.url.com/);
		  	backandService.signin('user', 'pass', 'app');
		  });
		  it('should allow to get token name', function() {
		  	expect(backandProvider.getTokenName()).toBeDefined();
		  });
		  it('should allow to set token name', function() {
		  	backandProvider.setTokenName("new_token");
		  	expect(backandProvider.getTokenName()).toEqual("new_token");
		  });
		  it('setTokenName should affect service tokenName', function() {
		  	backandProvider.setTokenName("new_token");
				backandService.signin('username', 'password', 'appName');
				httpBackend.flush();
				expect(cookieStore.put).toHaveBeenCalledWith('new_token', 'bearer my_token');
		  });
			it('should not set default headers on load', function() {
				expect(http.defaults.headers.common['Authorization']).not.toBeDefined();
			});
		});

		describe('service', function() {
			it('should getTokenName', function() {
				expect(backandService.getTokenName()).toBe('backand_token');
			});
			it('should getToken', function() {
				expect(backandService.getToken()).toBe('bearer initial_token');
			});
			it('should getApiUrl', function() {
				expect(backandService.getApiUrl()).toEqual("https://api.backand.com:8080");
			});
			describe('sign in', function() {
				it('should make an http call', function() {
					backandService.signin('username', 'password', 'appName');
					httpBackend.expectPOST(/\/token/, 'grant_type=password&username=username&password=password&appname=appName');
				});
				describe('upon success', function() {
					it('should be resolved', function() {
						var resolved = false;
						backandService.signin('username', 'password', 'appName')
							.then(function() {
								resolved = true;
							});
						httpBackend.flush();
						expect(resolved).toBeTruthy();
					});
					it('should store in cookie', function() {
						backandService.signin('username', 'password', 'appName');
						httpBackend.flush();
						expect(cookieStore.put).toHaveBeenCalledWith('backand_token', 'bearer my_token');
					});
					it('should not set http default header', function() {
						backandService.signin('username', 'password', 'appName');
						httpBackend.flush();
						expect(http.defaults.headers.common['Authorization']).not.toBeDefined();
					});
				});
				describe('upon failure', function() {
					it('should be rejected', function() {
						var rejected = false;
						backandService.signin('username', 'wrong', 'appName')
							.catch(function() {
								rejected = true;
							});
						httpBackend.flush();
						expect(rejected).toBeTruthy();
					});
					it('should not store in cookie', function() {
						backandService.signin('username', 'wrong', 'appName');
						httpBackend.flush();
						expect(cookieStore.remove).toHaveBeenCalledWith('backand_token');
						expect(cookieStore.put).not.toHaveBeenCalledWith('backand_token', 'bearer my_token');
					});
					it('should not set default header', function() {
						backandService.signin('username', 'wrong', 'appName');
						httpBackend.flush();
						expect(http.defaults.headers.common['Authorization']).not.toBeDefined();
					});
				});
			});
			describe('sign out', function() {
				it('should remove token form cookie', function() {
					backandService.signout();
					expect(cookieStore.remove).toHaveBeenCalledWith('backand_token');
				});
				it('should unset default header', function() {
					backandService.signout();
					expect(http.defaults.headers.common['Authorization']).not.toBeDefined();
				});
			});
			describe('signup', function() {
				it('should make an API call', function() {
					var data = {
            firstName: 'firstName',
            lastName: 'lastName',
            email: 'email',
            password: 'password',
            confirmPassword: 'password'
          };
					var headersMatcher = function(headers) {
	       		return headers['SignUpToken'] == 'SignUpToken';
	     		};
					httpBackend.expectPOST(/\/1\/user\/signup/, data, headersMatcher);
					backandService.signup('firstName', 'lastName', 'email', 'password', 'SignUpToken');
				});
				it('should return a promise', function() {
					var response = backandService.signup('firstName', 'lastName', 'email', 'password', 'SignUpToken');
					expect(response.then).toBeDefined();
				});
			});
			describe('forgotPassword', function() {
				it('should make an API call', function() {
					httpBackend.expectPOST(/\/api\/account\/SendChangePasswordLink/, {username: 'email'});
					backandService.forgotPassword('email');
				});
				it('should return a promise', function() {
					var response = backandService.forgotPassword('email');
					expect(response.then).toBeDefined();
				});
			});
			describe('resetPassword', function() {
				it('should make an API call', function() {
					var data = {
              confirmPassword: 'password',
              password: 'password',
              token: 'id'
          };
					httpBackend.expectPOST(/\/api\/account\/changePassword/, data);
					backandService.resetPassword('password', 'id');
				});
				it('should return a promise', function() {
					var response = backandService.resetPassword('password', 'id');
					expect(response.then).toBeDefined();
				});
			});
		});
	});
	describe('managing headers', function() {
		setup({manageDefaultHeaders: true});
	  it('should set default headers on load', function() {
	  	expect(http.defaults.headers.common['Authorization']).toEqual('bearer initial_token');
	  });
		it('should set default headers after signin', function() {
			backandService.signin('username', 'password', 'appName');
			httpBackend.flush();
			expect(http.defaults.headers.common['Authorization']).toBeDefined();
		});
	});
});
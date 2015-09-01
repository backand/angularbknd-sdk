/*
* Angular SDK to use with backand 
* @version 1.7.2 - 2015-09-01
* @link https://backand.com 
* @author Itay Herskovits 
* @license MIT License, http://www.opensource.org/licenses/MIT
 */
(function () {
    'use strict';

    // get token or error message from url in social sign-in popup
    var dataRegex = /\?(data|error)=(.+)/;
    var dataMatch = dataRegex.exec(location.href);
    if (dataMatch && dataMatch[1] && dataMatch[2]) {
        var userData = {};
        userData[dataMatch[1]] = JSON.parse(decodeURI(dataMatch[2].replace(/#.*/, '')));
        window.opener.postMessage(JSON.stringify(userData), location.origin);
    }

    var cookieStore;
    var config;
    var defaultHeaders;
    var token;
    var user;
    var http;
    angular.module('backand', ['ngCookies'])
        .provider('Backand', function () {

            // Configuration
            config = {
                apiUrl: "https://api.backand.com",
                tokenName: 'backand_token',
                anonymousToken: null,
                signUpToken: null,
                isManagingDefaultHeaders: false,
                appName: null,
                userProfileName: 'backand_user'
            };

            // Token
            token = {
                get: function() {
                    return cookieStore.get(config.tokenName);
                },
                set: function(_token) {
                    cookieStore.put(config.tokenName, _token);
                },
                remove: function () {
                    cookieStore.remove(config.tokenName);
                }
            };

            // Current User
            user = {
                get: function() {
                    return cookieStore.get(config.userProfileName);
                },
                set: function(_user) {
                    cookieStore.put(config.userProfileName, _user);
                },
                remove: function () {
                    cookieStore.remove(config.userProfileName);
                }
            };

            // Default headers
            defaultHeaders = {
                // set default Authorization header for all future $http calls
                set: function() {
                    if (!config.isManagingDefaultHeaders) return;
                    var t = token.get();
                    if(angular.isDefined(t)){
                        http.defaults.headers.common['Authorization'] = t;
                    }
                    if (config.anonymousToken) {
                        http.defaults.headers.common['AnonymousToken'] = config.anonymousToken;
                    }
                },

                // clear default Authorization header for all future $http calls
                clear: function(type) {
                    if (!config.isManagingDefaultHeaders) return;
                    if (type) {
                        if (http.defaults.headers.common[type]) {
                            delete http.defaults.headers.common[type];
                        }
                    } else {
                        if (http.defaults.headers.common['Authorization']) {
                            delete http.defaults.headers.common['Authorization'];
                        }
                        if (http.defaults.headers.common['AnonymousToken']) {
                            delete http.defaults.headers.common['AnonymousToken'];
                        }
                    }
                }
            };

            // Provider functions (should be called on module config block)
            this.getApiUrl = function () {
                return config.apiUrl;
            };
            this.setApiUrl = function (newApiUrl) {
                config.apiUrl = newApiUrl;
                return this;
            };
            this.getTokenName = function (newTokenName) {
                return config.tokenName;
            };
            this.setTokenName = function (newTokenName) {
                config.tokenName = newTokenName;
                return this;
            };
            this.setAnonymousToken = function (anonymousToken) {
                config.anonymousToken = anonymousToken;
                return this;
            };

            this.setSignUpToken = function (signUpToken) {
                config.signUpToken = signUpToken;
                return this;
            };

            this.setAppName = function (appName) {
                config.appName = appName;
                return this;
            };

            this.manageDefaultHeaders = function(isManagingDefaultHeaders) {
                if (isManagingDefaultHeaders == undefined) isManagingDefaultHeaders = true
                config.isManagingDefaultHeaders = isManagingDefaultHeaders;
                return this;
            };

            // $get returns the service
            this.$get = ['$q', '$rootScope', 'BackandHttpBufferService', function ($q, $rootScope, BackandHttpBufferService) {
                return new BackandService($q, $rootScope, BackandHttpBufferService);
            }];

            // Backand Service
            function BackandService($q, $rootScope, BackandHttpBufferService) {
                var self = this;

                var authenticating = false;

                self.EVENTS = {
                    SIGNIN: 'BackandSignIn',
                    SIGNOUT: 'BackandSignOut',
                };

                self.setAppName = function (appName) {
                    config.appName = appName;
                };

                var providers = {
                    github: {name: 'github', label: 'Github', url: 'www.github.com', css: 'github', id: 1},
                    google: {name: 'google', label: 'Google', url: 'www.google.com', css: 'google-plus', id: 2},
                    facebook: {name: 'facebook', label: 'Facebook', url: 'www.facebook.com', css: 'facebook', id: 3}
                };

                self.getSocialProviders = function () {
                    return providers;
                };

                function getSocialUrl(providerName, isSignup) {
                    var provider = providers[providerName];
                    var action = isSignup ? 'up' : 'in';
                    return 'user/socialSign' + action +
                        '?provider=' + provider.label +
                        '&response_type=token&client_id=self&redirect_uri=' + provider.url +
                        '&state=';
                }

                self.socialSignin = function (provider) {
                    return self.socialAuth(provider, false)
                };

                self.socialSignup = function (provider) {
                    return self.socialAuth(provider, true)
                };

                self.socialAuth = function (provider, isSignUp) {
                    self.loginPromise = $q.defer();

                    self.socialAuthWindow = window.open(
                        config.apiUrl + '/1/' +
                        getSocialUrl(provider, isSignUp) +
                        '&appname=' + config.appName + '&returnAddress=',
                        'id1', 'left=10, top=10, width=600, height=600');

                    window.addEventListener('message', setUserDataFromToken, false);
                    return self.loginPromise.promise;
                };

                function setUserDataFromToken (event) {
                    self.socialAuthWindow.close();
                    self.socialAuthWindow = null;
                    if (event.origin !== location.origin)
                        return;
                    var userData = JSON.parse(event.data);
                    if (userData.error) {
                        self.loginPromise.reject({
                            data: userData.error.message + ' (signing in with ' + userData.error.provider + ')'
                        });
                        return;
                    } else if (userData.data) {
                        return self.signinWithToken(userData.data);
                    } else {
                        self.loginPromise.reject();
                    }
                }

                self.signin = function(username, password, appName) {
                    if (appName) {
                        self.setAppName(appName);
                    }

                    var userData = {
                        grant_type: 'password',
                        username: username,
                        password: password,
                        appname: config.appName
                    };
                    return authenticate(userData)
                };

                self.signinWithToken = function (userData) {
                    var tokenData = {
                        grant_type: 'password',
                        accessToken: userData.access_token,
                        appName: config.appName
                    };
                    return authenticate(tokenData)
                };

                self.getUserDetails = function (force) {
                    var deferred = $q.defer();
                    if (force) {
                        http({
                            method: 'GET',
                            url: config.apiUrl + '/api/account/profile'
                        })
                            .success(function (profile) {
                                user.set(profile);
                                deferred.resolve(user.get());
                            })
                    } else {
                        deferred.resolve(user.get());
                    }
                    return deferred.promise;
                };

                self.getUsername = function () {
                    var userDetails = cookieStore.get(config.userProfileName);
                    if (userDetails) {
                        return userDetails.username;
                    }
                    else {
                        return null;
                    }
                };

                self.getUserRole = function () {
                    var userDetails = cookieStore.get(config.userProfileName);
                    if (userDetails) {
                        return userDetails.role;
                    }
                    else {
                        return null;
                    }
                };

                function authenticate (authData) {
                    if (authenticating) {
                        return;
                    }
                    authenticating = true;
                    token.remove();
                    defaultHeaders.clear();
                    return http({
                        method: 'POST',
                        url: config.apiUrl + '/token',
                        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                        transformRequest: function (obj) {
                            var str = [];
                            angular.forEach(obj, function(value, key){
                                str.push(encodeURIComponent(key) + "=" + encodeURIComponent(value));
                            });
                            return str.join("&");
                        },
                        data: authData

                    }).then(function (response) {
                        if (response.data && response.data.access_token) {
                            config.token = 'bearer ' + response.data.access_token;

                            token.set(config.token);
                            defaultHeaders.set();
                            user.set(response.data);

                            if (self.loginPromise) {
                                self.loginPromise.resolve(config.token);
                            }

                            BackandHttpBufferService.retryAll();
                            $rootScope.$broadcast(self.EVENTS.SIGNIN);

                        } else if (self.loginPromise) {
                            self.loginPromise.reject('token is undefined');
                        }
                        return response.data;

                    })
                    .catch(function (err) {
                        if (self.loginPromise) {
                            self.loginPromise.reject(err);
                        }
                    })
                    .finally(function () {
                        authenticating = false;
                    });
                }

                self.signout = function() {
                    token.remove();
                    user.remove();
                    defaultHeaders.clear();
                    defaultHeaders.set();
                    BackandHttpBufferService.rejectAll('signed out');
                    $rootScope.$broadcast(self.EVENTS.SIGNOUT);
                    return $q.when(true);
                };

                self.signup = function (firstName, lastName, email, password, confirmPassword) {
                    return http({
                            method: 'POST',
                            url: config.apiUrl + '/1/user/signup',
                            headers: { 'SignUpToken': config.signUpToken },
                            data: {
                                firstName: firstName,
                                lastName: lastName,
                                email: email,
                                password: password,
                                confirmPassword: confirmPassword
                            }
                        }
                    )
                };

                self.requestResetPassword = function(email, appName) {

                    if (appName) {
                        self.setAppName(appName);
                    }

                    return http({
                            method: 'POST',
                            url: config.apiUrl + '/1/user/requestResetPassword',
                            data: {
                                appName: config.appName,
                                username: email
                            }
                        }
                    )
                };

                self.resetPassword = function(newPassword, resetToken) {
                    return http({
                        method: 'POST',
                        url: config.apiUrl + '/1/user/resetPassword',
                        data: {
                            newPassword: newPassword,
                            resetToken: resetToken
                        }
                    });
                };

                self.changePassword = function(oldPassword, newPassword) {
                    return http({
                        method: 'POST',
                        url: config.apiUrl + '/1/user/changePassword',
                        data: {
                            oldPassword: oldPassword,
                            newPassword: newPassword
                        }
                    });
                };

                self.refreshToken = function () {
                    defaultHeaders.clear('Authorization');

                    var tokenData = {
                        grant_type: 'password',
                        refreshToken: user.get().refresh_token,
                        username: self.getUsername(),
                        appName: config.appName
                    };
                    return authenticate(tokenData);
                };

                self.getToken = function() {
                    return token.get();
                };

                self.getTokenName = function() {
                    return config.tokenName;
                };

                self.getApiUrl = function () {
                    return config.apiUrl;
                };

                // backward compatibility
                self.socialSignIn = self.socialSignin;
                self.socialSignUp = self.socialSignup;
                self.signInWithToken = self.signinWithToken;
            }
        })
        .config(['$httpProvider', function ($httpProvider) {
            $httpProvider.interceptors.push('BackandHttpInterceptor');
        }])
        .run(['$injector', function($injector) {
            $injector.invoke(['$http', '$cookieStore', function($http, $cookieStore) {
                // Cannot inject cookieStore and http to provider, so doing it here:
                cookieStore = $cookieStore;
                http = $http;
            }]);
            // On load - set default headers from cookie (if managing default headers)
            defaultHeaders.set();
        }]);

})();
;(function () {
    angular.module('backand').factory('BackandHttpInterceptor', ['$q', 'Backand', 'BackandHttpBufferService', HttpInterceptor]);


    function HttpInterceptor ($q, Backand, BackandHttpBufferService) {
        return {
            responseError: function (rejection) {
                if (rejection.config.url !== Backand.getApiUrl() + 'token') {
                    if (rejection.status === 401) {

                        Backand.refreshToken();
                        var deferred = $q.defer();
                        BackandHttpBufferService.append(rejection.config, deferred);
                        return deferred.promise;
                    }
                }
                return $q.reject(rejection);
            }
        }
    }
})();
;(function () {
    angular.module('backand').service('BackandHttpBufferService', ['$injector', HttpBufferService]);

        function HttpBufferService($injector) {
        var self = this;
        var buffer = [];

        function retryHttpRequest(config, deferred) {
            function successCallback(response) {
                deferred.resolve(response);
            }
            function errorCallback(response) {
                deferred.reject(response);
            }
            var $http = $injector.get('$http');
            $http = $http || $injector.get('$http');
            $http(config).then(successCallback, errorCallback);
        }

        self.append = function (config, deferred) {
            buffer.push({
                config: config,
                deferred: deferred
            });
        };

        self.rejectAll = function (reason) {
            if (reason) {
                for (var i = 0; i < buffer.length; ++i) {
                    buffer[i].deferred.reject(reason);
                }
            }
            buffer = [];
        };

        function updater (config) {
            delete config.headers.Authorization;
            return config;
        }

        self.retryAll = function () {
            for (var i = 0; i < buffer.length; ++i) {
                retryHttpRequest(updater(buffer[i].config), buffer[i].deferred);
            }
            buffer = [];
        }

    }

})();

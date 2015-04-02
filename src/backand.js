(function () {
    'use strict';

    var cookieStore;
    var config;
    var defaultHeaders;
    var token;
    var http;
    angular.module('backand', ['ngCookies'])
        .provider('Backand', function () {

            // Configuration
            config = {
                apiUrl: "https://api.backand.com:8080",
                tokenName: 'backand_token',
                isManagingDefaultHeaders: false
            }

            // Token
            token = {
                get: function() {
                    return cookieStore.get(config.tokenName);
                },
                set: function(_token) {
                    cookieStore.put(config.tokenName, _token);
                },
                remove: function() {
                    cookieStore.remove(config.tokenName);
                }
            }

            // Default headers
            defaultHeaders = {
                // set default Authorization header for all future $http calls
                set: function() {
                    if (!config.isManagingDefaultHeaders) return;
                    var t = token.get();
                    if(angular.isDefined(t)){
                        http.defaults.headers.common['Authorization'] = t;
                    }
                },

                // clear default Authorization header for all future $http calls
                clear: function() {
                    if (!config.isManagingDefaultHeaders) return;
                    if (http.defaults.headers.common['Authorization']) {
                        delete http.defaults.headers.common['Authorization'];
                    }
                }
            };

            // Provider functions (should be called on module config block)
            this.getApiUrl = function () {
                return config.apiUrl;
            }
            this.setApiUrl = function (newApiUrl) {
                config.apiUrl = newApiUrl;
                return this;
            };
            this.getTokenName = function (newTokenName) {
                return config.tokenName;
            }
            this.setTokenName = function (newTokenName) {
                config.tokenName = newTokenName;
                return this;
            };
            this.manageDefaultHeaders = function(isManagingDefaultHeaders) {
                if (isManagingDefaultHeaders == undefined) isManagingDefaultHeaders = true
                config.isManagingDefaultHeaders = isManagingDefaultHeaders;
                return this;
            }

            // $get returns the service
            this.$get = ['$q', function ($q) {
                return new BackandService($q);
            }];

            // Backand Service
            function BackandService($q) {
                this.signin = function(username, password, appName) {
                    var deferred = $q.defer();
                    token.remove();
                    defaultHeaders.clear();
                    http({
                        method: 'POST',
                        url: config.apiUrl + '/token',
                        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                        transformRequest: function (obj) {
                            var str = [];
                            angular.forEach(obj, function(value, key){
                                str.push(encodeURIComponent(key) + "=" + encodeURIComponent(value));
                            })
                            return str.join("&");
                        },
                        data: {
                            grant_type: 'password',
                            username: username,
                            password: password,
                            appname: appName
                        }
                    })
                        .success(function (data) {
                            if(angular.isDefined(data) && data != null){
                                if(angular.isDefined(data.access_token)) {
                                    config.token = 'bearer ' + data.access_token;
                                    token.set(config.token);
                                    defaultHeaders.set();
                                    deferred.resolve(config.token);
                                }
                            }
                            else {
                                deferred.reject('token is undefined');
                            }

                        })
                        .error(function (err) {
                            deferred.reject(err);
                        });

                    return deferred.promise;
                }

                this.signout = function() {
                    token.remove();
                    defaultHeaders.clear();                        
                    return $q.when(true);
                }

                this.signup = function(firstName, lastName, email, password, SignUpToken) {
                    return http({
                            method: 'POST',
                            url: config.apiUrl + '/1/user/signup',
                            headers: {'SignUpToken': SignUpToken},
                            data: {
                              firstName: firstName,
                              lastName: lastName,
                              email: email,
                              password: password,
                              confirmPassword: password
                            }
                        }
                    )
                }

                this.forgotPassword = function(email) {
                    return http({
                            method: 'POST',
                            url: config.apiUrl + '/api/account/SendChangePasswordLink',
                            data: {
                                username: email
                            }
                        }
                    )
                }

                this.resetPassword = function(password, id) {
                    return http({
                        method: 'POST',
                        url: config.apiUrl + '/api/account/changePassword',
                        data: {
                            confirmPassword: password,
                            password: password,
                            token: id
                        }
                    });
                }

                this.getToken = function() {
                    return token.get();
                }

                this.getTokenName = function() {
                    return config.tokenName;
                }

                this.getApiUrl = function () {
                    return config.apiUrl;
                }
            }
        })
        .run(function($injector) {
            $injector.invoke(function($http, $cookieStore) {
                // Cannot inject cookieStore and http to provider, so doing it here:
                cookieStore = $cookieStore;
                http = $http;                
            });
            // On load - set default headers from cookie (if managing default headers)
            defaultHeaders.set();
        });


    angular.module('backand.utils', [])
        .provider('BackandUtils', function () {

            this.$get = ['$http', '$q', '$upload', function ($http, $q, $upload) {
                this.uploadFile = function(file, tableName, fieldName) {
                    var response = $q.defer();
                    $upload.upload({
                        url: config.apiUrl + '/1/file/upload/' + tableName + '/' + fieldName,
                        file: file,
                        headers: {
                            'Authorization': token.get()
                        }
                    }).success(function (data) {
                        var curr = {message: '', url: '', success: false};

                        if (data.files[0].success) {
                            curr.url = data.files[0].url;
                            curr.success = true;
                        } else {
                            curr.message = data.files[0].error;
                            curr.success = false;
                        }
                        response.resolve(curr);
                    }).error(function (data) {
                        var curr = {message: '', url: '', success: false};
                        curr.message = data.Message;
                        curr.success = false;
                        response.resolve(curr);
                    });

                    return response.promise;
                }
            }]
        });

    angular.module('backand.orm', [])
        .provider('BackandORM', function () {

            this.$get = ['Restangular', 'Backand', function (Restangular, Backand) {

                function createORMForConfiguration(backandConfig) {
                    //ORM of Backand
                    var orm = {};
                    function config() {
                        Restangular.setResponseExtractor(function (response, operation) {
                            if (operation === 'getList' && !angular.isArray(response)) {
                                return response.data;
                            }
                            return response;
                        });

                        Restangular.setRestangularFields({
                            id: "__metadata.id",
                            route: "restangularRoute",
                            selfLink: "self.href"
                        });

                        Restangular.setBaseUrl(backandConfig.apiUrl + "/1/table/data");
                    }

                    function setCredentials(token) {
                        Restangular.setDefaultHeaders({ Authorization: token });
                    }

                    function clearCredentials() {
                        Restangular.setDefaultHeaders({ Authorization: '' });

                    }

                    orm.config = config;
                    orm.setCredentials = setCredentials;
                    orm.clearCredentials = clearCredentials;

                    return orm;

                }

                return createORMForConfiguration(Backand.configuration);
            }]
        });

})();
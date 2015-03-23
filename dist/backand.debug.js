/*
* Angular SDK to use with backand 
* @version 1.5.1 - 2015-03-22
* @link https://backand.com 
* @author Itay Herskovits 
* @license MIT License, http://www.opensource.org/licenses/MIT
 */
(function () {
    'use strict';

    angular.module('backand', [])
        .provider('Backand', function () {

            // Configuration
            var Configurator = {};

            Configurator.init = function (object, config) {

                object.configuration = config;
                /**
                 * This is the apiURL to be used with Backand
                 */
                config.apiUrl = config.apiUrl || "https://api.backand.com:8080";
                object.setApiUrl = function (newApiUrl) {
                    config.apiUrl = newApiUrl;
                    return this;
                };
                object.setTokenName = function (newTokenName) {
                    config.tokenName = newTokenName;
                    return this;
                };
                config.tokenName = 'backand_token';
                config.token = null;

            };

            var globalConfiguration = {};
            Configurator.init(this, globalConfiguration);

            this.$get = ['$http', '$cookieStore', '$q', function ($http, $cookieStore, $q) {

                function createServiceForConfiguration(config) {
                    // Service
                    var service = {};

                    function signin(username, password, appName) {
                        var deferred = $q.defer();
                        token.remove();
                        $http({
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
                                        token.put(config.token);
                                        setDefaultHeader(config.token);
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

                    var token = {};
                    token.get = function(){
                        return $cookieStore.get(config.tokenName);
                    }

                    token.put = function(token){
                        $cookieStore.put(config.tokenName, token);
                    }

                    token.remove = function(){
                        $cookieStore.remove(config.tokenName);
                    }


                    function setDefaultHeader(token){
                        var t = token || $cookieStore.get(config.tokenName);
                        if(angular.isDefined(t)){
                            $http.defaults.headers.common['Authorization'] = t;
                        }
                    }

                    function signout() {
                        var deferred = $q.defer();
                        token.remove();
                        deferred.resolve(true);
                        deferred.promise;

                    }

                    function signup(firstName, lastName, email, password, SignUpToken) {
                        return $http({
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

                    function forgotPassword(email) {
                        return $http({
                                method: 'POST',
                                url: config.apiUrl + '/api/account/SendChangePasswordLink',
                                data: {
                                    username: email
                                }
                            }
                        )
                    }

                    function resetPassword(password, id) {
                        return $http({
                            method: 'POST',
                            url: config.apiUrl + '/api/account/changePassword',
                            data: {
                                confirmPassword: password,
                                password: password,
                                token: id
                            }
                        });
                    }

                    Configurator.init(service, config);
                    service.setDefaultHeader = setDefaultHeader;
                    service.signin = signin;
                    service.signout = signout;
                    service.signup = signup;
                    service.forgotPassword = forgotPassword;
                    service.resetPassword = resetPassword;
                    service.token = token;

                    return service;
                }

                return createServiceForConfiguration(globalConfiguration);

            }];
        });

    angular.module('backand.utils', [])
        .provider('BackandUtils', function () {

            this.$get = ['$http', '$cookieStore', '$q', '$upload','Backand', function ($http, $cookieStore, $q, $upload, Backand) {

                function createUtilsForConfiguration(config) {
                    //Utils of Backand
                    var utils = {};

                    function uploadFile(file, tableName, fieldName) {
                        var response = $q.defer();
                        $upload.upload({
                            url: config.apiUrl + '/1/file/upload/' + tableName + '/' + fieldName,
                            file: file,
                            headers: {
                                'Authorization': config.token
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

                    utils.uploadFile = uploadFile;

                    return utils;
                }

                return createUtilsForConfiguration(Backand.configuration);
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
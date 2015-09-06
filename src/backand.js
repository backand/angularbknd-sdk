'use strict';

angular.module('backand', [])
    .provider('Backand', function () {

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
            config.isManagingDefaultHeaders = isManagingDefaultHeaders == undefined ? true : isManagingDefaultHeaders;
            return this;
        };

        // $get returns the service
        this.$get = ['BackandAuthService', 'BackandUserService', function (BackandAuthService, BackandUserService) {
            return new BackandService(BackandAuthService, BackandUserService);
        }];

        // Backand Service
        function BackandService(BackandAuthService, BackandUserService) {
            var self = this;

            self.EVENTS = EVENTS;

            self.setAppName = function (appName) {
                config.appName = appName;
            };

            self.signin = function(username, password, appName) {
                if (appName) {
                    self.setAppName(appName);
                }
                return BackandAuthService.signin(username, password)
            };

            self.signout = function() {
                return BackandAuthService.signout();
            };

            self.signup = function (firstName, lastName, email, password, confirmPassword, parameters) {
                return BackandAuthService.signup(firstName, lastName, email, password, confirmPassword, parameters);
            };

            self.getSocialProviders = function () {
                return socialProviders;
            };

            self.socialSignin = function (provider, spec) {
                return BackandAuthService.socialAuth(provider, false, spec)
            };

            self.socialSignup = function (provider, spec) {
                return BackandAuthService.socialAuth(provider, true, spec)
            };

            self.requestResetPassword = function(email, appName) {
                if (appName) {
                    self.setAppName(appName);
                }
                return BackandAuthService.requestResetPassword(email, appName);
            };

            self.resetPassword = function(newPassword, resetToken) {
                return BackandAuthService.resetPassword(newPassword, resetToken);
            };

            self.changePassword = function(oldPassword, newPassword) {
                return BackandAuthService.changePassword(oldPassword, newPassword)
            };


            self.getUserDetails = function (force) {
                return BackandUserService.getUserDetails(force)
            };

            self.getUsername = function () {
                return BackandUserService.getUsername();
            };

            self.getUserRole = function () {
                return BackandUserService.getUserRole();
            };

            self.getToken = function() {
                return BKStorage.token.get();
            };

            self.getTokenName = function() {
                return config.tokenName;
            };

            self.getApiUrl = function () {
                return config.apiUrl;
            };

            self.isManagingDefaultHeaders = function () {
                return config.isManagingDefaultHeaders;
            };

            // backward compatibility
            self.socialSignIn = self.socialSignin;
            self.socialSignUp = self.socialSignup;
            self.signInWithToken = self.signinWithToken;
        }
    })
    .run(['$injector', function($injector) {
        $injector.invoke(['$http', function($http) {
            // Cannot inject http to provider, so doing it here:
            http = $http;
        }]);
    }]);

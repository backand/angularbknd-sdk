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

        this.setSocketUrl = function (newSocketUrl) {
          config.socketUrl = newSocketUrl;
          return this;
        };

        // deprecated
        this.getTokenName = function () {
            return null;
        };

        // deprecated
        this.setTokenName = function () {
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

        // deprecated
        this.manageDefaultHeaders = function (isManagingDefaultHeaders) {
            return this;
        };

        this.manageHttpInterceptor = function (isManagingHttpInterceptor) {
            config.isManagingHttpInterceptor = isManagingHttpInterceptor == undefined ? true : isManagingHttpInterceptor;
            return this;
        };

        this.manageRefreshToken = function (isManagingRefreshToken) {
            config.isManagingRefreshToken = isManagingRefreshToken == undefined ? true : isManagingRefreshToken;
            return this;
        };

        this.runSigninAfterSignup = function (runSigninAfterSignup) {
            config.runSigninAfterSignup = runSigninAfterSignup == undefined ? true : runSigninAfterSignup;
            return this;
        };

        this.runSocket = function (runSocket) {
          config.runSocket = runSocket == undefined ? false : runSocket;
          return this;
        };

        // $get returns the service
        this.$get = ['BackandAuthService', 'BackandUserService','BackandSocketService', function (BackandAuthService, BackandUserService, BackandSocketService) {
            return new BackandService(BackandAuthService, BackandUserService, BackandSocketService);
        }];

        // Backand Service
        function BackandService(BackandAuthService, BackandUserService, BackandSocketService) {
            var self = this;

            self.EVENTS = EVENTS;

            self.setAppName = function (appName) {
                config.appName = appName;
            };

            self.signin = function (username, password) {
                return BackandAuthService.signin(username, password)
            };

            self.signout = function () {
                return BackandAuthService.signout();
            };

            self.signup = function (firstName, lastName, email, password, confirmPassword, parameters) {
                return BackandAuthService.signup(firstName, lastName, email, password, confirmPassword, parameters);
            };

            self.getSocialProviders = function () {
                return socialProviders;
            };

            self.socialSignin = function (provider, spec) {
                return BackandAuthService.socialSignin(provider, spec)
            };

            self.socialSignup = function (provider, parameters, spec, email) {
                return BackandAuthService.socialSignup(provider, parameters, spec, email)
            };

            self.socialSignInToken = function(provider, token){
                return BackandAuthService.socialSigninWithToken(provider, token)
            }

            self.socialSignInCode = function(provider, code){
                var returnUrl = window.location.origin;

                if(!provider || !code) {
                    throw new Error("provide and code have to be valid values");
                }

                return BackandAuthService.socialSigninWithCode(provider, returnUrl, code);
            }


            self.socialSignUpCode = function(provider, code, username, firstname, lastname){
                if(!provider || !code) {
                    throw new Error("provide and code have to be valid values");
                }
                var returnUrl = window.location.origin;

                return BackandAuthService.socialSignupWithCode(provider, returnUrl, code,
                    username, firstname, lastname);
            }

            self.requestResetPassword = function (email) {
                return BackandAuthService.requestResetPassword(email);
            };

            self.resetPassword = function (newPassword, resetToken) {
                return BackandAuthService.resetPassword(newPassword, resetToken);
            };

            self.changePassword = function (oldPassword, newPassword) {
                return BackandAuthService.changePassword(oldPassword, newPassword)
            };

            self.setIsMobile = function(val){
                config.isMobile = val;
            };

            self.setRunSignupAfterErrorInSigninSocial = function(val){
                config.callSignupOnSingInSocialError = val;
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

            self.getToken = function () {
                return BKStorage.token.get();
            };

            // deprecated
            self.getTokenName = function () {
                return null;
            };

            self.getApiUrl = function () {
                return config.apiUrl;
            };

            // deprecated
            self.isManagingDefaultHeaders = function () {
                return null;
            };

            self.isManagingHttpInterceptor = function () {
                return config.isManagingHttpInterceptor;
            };

            self.isManagingRefreshToken = function () {
                return config.isManagingRefreshToken && BKStorage.user.get() && BKStorage.user.get().refresh_token;
            };

            //Socket.io service
            self.isRunScoket = function () {
              return config.runScoket;
            };

            self.socketLogin = function(){
              if(config.runSocket)
                BackandSocketService.login(BKStorage.token.get(), config.anonymousToken, config.appName, config.socketUrl);
            };

            self.on = function(eventName, callback){
              BackandSocketService.on(eventName, callback);
            };

            // backward compatibility
            self.socialSignIn = self.socialSignin;
            self.socialSignUp = self.socialSignup;
        }
    })
    .run(['$injector', function ($injector) {
        $injector.invoke(['$http', function ($http) {
            // Cannot inject http to provider, so doing it here:
            http = $http;
        }]);
        $injector.invoke(['Backand', function (Backand) {
          // Cannot inject http to provider, so doing it here:
          Backand.socketLogin();
        }]);
    }]);

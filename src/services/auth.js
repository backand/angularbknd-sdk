angular.module('backand').service('BackandAuthService', ['$q', '$rootScope', 'BackandHttpBufferService', BackandAuthService]);

function BackandAuthService ($q, $rootScope, BackandHttpBufferService) {
    var self = this;
    var authenticating = false;

    var urls = {
        signup: '/1/user/signup',
        token: '/token',
        requestResetPassword: '/1/user/requestResetPassword',
        resetPassword: '/1/user/resetPassword',
        changePassword: '/1/user/changePassword'
    };

    // basic authentication

    self.signin = function (username, password) {
        var userData = {
            grant_type: 'password',
            username: username,
            password: password,
            appname: config.appName
        };
        return authenticate(userData)
    };

    self.signout = function() {
        BKStorage.token.clear();
        BKStorage.user.clear();

        BackandHttpBufferService.rejectAll('signed out');
        $rootScope.$broadcast(EVENTS.SIGNOUT);
        return $q.when(true);
    };

    self.signup = function (firstName, lastName, email, password, confirmPassword, parameters) {
        return http({
            method: 'POST',
            url: config.apiUrl + urls.signup,
            headers: {
                'SignUpToken': config.signUpToken
            },
            data: {
                firstName: firstName,
                lastName: lastName,
                email: email,
                password: password,
                confirmPassword: confirmPassword,
                parameters: parameters
            }
        }).then(function (response) {
            $rootScope.$broadcast(EVENTS.SIGNUP);

            if (config.runSigninAfterSignup
                && response.data.currentStatus === 1) {
                return self.signin(email, password);
            }

            return response;
        })
    };

    // social authentication
    self.socialSignin = function (provider, spec) {
        return socialAuth(provider, false, spec);
    };

    self.socialSignup = function (provider, parameters, spec) {
        self.signupParameters = parameters;
        self.inSocialSignup = true;
        return socialAuth(provider, true, spec);
    };

    function socialAuth (provider, isSignUp, spec) {
        if (!socialProviders[provider]) {
            throw Error('Unknown Social Provider');
        }

        self.loginPromise = $q.defer();

        self.socialAuthWindow = window.open(
            config.apiUrl + '/1/'
            + getSocialUrl(provider, isSignUp)
            + '&appname=' + config.appName
            + '&returnAddress=',
            'id1',
            spec || 'left=1, top=1, width=600, height=600');

        window.addEventListener('message', setUserDataFromToken, false);
        return self.loginPromise.promise;
    }

    function setUserDataFromToken (event) {
        self.socialAuthWindow.close();
        self.socialAuthWindow = null;

        if (event.origin !== location.origin) {
            return;
        }

        var userData = JSON.parse(event.data);
        if (userData.error) {

            var rejection = {
                data: userData.error.message + ' (signing in with ' + userData.error.provider + ')'
            };
            rejection.error_description = rejection.data;
            self.loginPromise.reject(rejection);

        } else if (userData.data) {
            if (self.inSocialSignup) {
                self.inSocialSignup = false;
                $rootScope.$broadcast(EVENTS.SIGNUP);
            }
            return signinWithToken(userData.data);

        } else {
            self.loginPromise.reject();
        }
    }

    // tokens authentication

    function signinWithToken (userData) {
        var tokenData = {
            grant_type: 'password',
            accessToken: userData.access_token,
            appName: config.appName
        };

        if (self.signupParameters) {
            tokenData.parameters = self.signupParameters;
            self.signupParameters = null;
        }

        return authenticate(tokenData)
    }

    self.refreshToken = function (username) {
        BKStorage.token.clear();

        var user = BKStorage.user.get();
        var refreshToken;
        if (!user || !(refreshToken = BKStorage.user.get().refresh_token)) {
            return;
        }

        var tokenData = {
            grant_type: 'password',
            refreshToken: refreshToken,
            username: username,
            appName: config.appName
        };
        return authenticate(tokenData);
    };


    function authenticate (authData) {
        if (authenticating) {
            return;
        }
        authenticating = true;
        BKStorage.token.clear();
        return http({
            method: 'POST',
            url: config.apiUrl + urls.token,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
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

                BKStorage.token.set(config.token);
                BKStorage.user.set(response.data);

                if (self.loginPromise) {
                    self.loginPromise.resolve(config.token);
                }

                BackandHttpBufferService.retryAll();
                $rootScope.$broadcast(EVENTS.SIGNIN);

            } else if (self.loginPromise) {
                self.loginPromise.reject('token is undefined');
            }
            return response.data;

        }).catch(function (err) {
            if (self.loginPromise) {
                self.loginPromise.reject(err);
            }
            return $q.reject(err.data);

        }).finally(function () {
            authenticating = false;
        });
    }


    // password management

    self.requestResetPassword = function (email) {
        return http({
            method: 'POST',
            url: config.apiUrl + urls.requestResetPassword,
            data: {
                appName: config.appName,
                username: email
            }
        })
    };

    self.resetPassword = function (newPassword, resetToken) {
        return http({
            method: 'POST',
            url: config.apiUrl + urls.resetPassword,
            data: {
                newPassword: newPassword,
                resetToken: resetToken
            }
        });
    };

    self.changePassword = function (oldPassword, newPassword) {
        return http({
            method: 'POST',
            url: config.apiUrl + urls.changePassword,
            data: {
                oldPassword: oldPassword,
                newPassword: newPassword
            }
        });
    };


}

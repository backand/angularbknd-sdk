angular.module('backand')
    .service('BackandAuthService', ['$q', '$rootScope', 'BackandHttpBufferService', 'BackandSocketService', BackandAuthService]);

function BackandAuthService($q, $rootScope, BackandHttpBufferService, BackandSocketService) {
    var self = this;
    var authenticating = false;
    var NOT_SIGNEDIN_ERROR = 'The user is not signed up to';
    var dummyReturnAddress = 'http://www.backandaaaa.com';

    var urls = {
        signup: '/1/user/signup',
        token: '/token',
        requestResetPassword: '/1/user/requestResetPassword',
        resetPassword: '/1/user/resetPassword',
        changePassword: '/1/user/changePassword',
        socialLoginWithCode: '/1/user/PROVIDER/code',
        socialSingupWithCode: '/1/user/PROVIDER/signupCode',
        socialLoginWithToken: '/1/user/PROVIDER/token'
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

    self.signout = function () {
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

    self.socialSignup = function (provider, parameters, spec, email) {
        self.signupParameters = parameters;
        self.inSocialSignup = true;
        return socialAuth(provider, true, spec, email);
    };

    self.socialSigninWithCode = function (provider, returnUrl, code) {
        if (authenticating) {
            return;
        }

        var authData = {
            "code": code,
            "clientId": '',
            "redirectUri": returnUrl,
            "appName": config.appName
        }

        authenticating = true;
        BKStorage.token.clear();
        return http({
            method: 'POST',
            url: config.apiUrl + urls.socialLoginWithCode.replace('PROVIDER', provider),
            headers: {
                'Content-Type': 'application/json'
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

                if (config.runSocket)
                    BackandSocketService.login(BKStorage.token.get(), config.anonymousToken, config.appName, config.socketUrl);


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

    self.socialSignupWithCode = function (provider, returnUrl, code, username, firstname, lastname) {
        if (!code || !provider) {
            throw new Error("can't signup without code from provider")
        }

        var authData = {
            "code": code,
            "clientId": '',
            "redirectUri": returnUrl || null,
            "appName": config.appName,
            "firstName": firstname || null,
            "lastName": lastname || null,
            "userName": username || null
        }

        authenticating = true;
        BKStorage.token.clear();
        return http({
            method: 'POST',
            url: config.apiUrl + urls.socialSingupWithCode.replace('PROVIDER', provider),
            headers: {
                'Content-Type': 'application/json'
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

                if (config.runSocket)
                    BackandSocketService.login(BKStorage.token.get(), config.anonymousToken, config.appName, config.socketUrl);


            } else if (self.loginPromise) {
                self.loginPromise.reject('token is undefined');
            }
            return response.data;

        }).catch(function (err) {
            if (self.loginPromise) {
                self.loginPromise.reject(err);
            }
            return $q.reject(err.data);

        })
    }

    self.socialSigninWithToken = function (provider, token) {
        if (authenticating) {
            return;
        }

        var url = config.apiUrl + urls.socialLoginWithToken.replace('PROVIDER', provider) + "?accessToken=" + encodeURIComponent(token) + "&appName=" + encodeURI(config.appName);
        console.log(url);
        authenticating = true;
        BKStorage.token.clear();
        return http({
            method: 'GET',
            url: url,
            headers: {
                'Content-Type': 'application/json'
            }
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

                if (config.runSocket)
                    BackandSocketService.login(BKStorage.token.get(), config.anonymousToken, config.appName, config.socketUrl);


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

    function mobileSocialLoginInner(ref, isSignUp, provider, spec) {
        ref.addEventListener('loadstart', function (e) {
                if (e.url.indexOf(dummyReturnAddress) == 0) { // mean startWith

                    try {
                        ref.close();
                    }
                    catch (err) {
                    }

                    var url = e.url;
                    // handle case of misformatted json from server
                    if (url.indexOf('#') === (url.length - 1)) // last char
                    {
                        url = url.slice(0, url.length - 1);
                    }

                    // error return from server
                    if (url.indexOf('error=') > -1) {
                        // handle case of strange chars in the end of url on login error
                        var urlParsed =  new URL(url);

                        var dataStr = decodeURI(urlParsed.search).split('error=')[1];
                        var userData = JSON.parse(dataStr);
                        if (!isSignUp && config.callSignupOnSingInSocialError && userData.message.indexOf(NOT_SIGNEDIN_ERROR) > -1) {  // check is right error
                            socialAuth(provider, true, spec);
                            return;
                        }

                        var rejection = {
                            data: userData.message + ' (signing in with ' + userData.provider + ')'
                        };

                        rejection.error_description = rejection.data;
                        self.loginPromise.reject(rejection);
                        return;
                    }

                    // login is OK
                    var dataStr = decodeURI(url).split('/#/?data=')[1];
                    var userData = JSON.parse(dataStr);
                    if (self.inSocialSignup) {
                        self.inSocialSignup = false;
                        $rootScope.$broadcast(EVENTS.SIGNUP);
                    }
                    signinWithToken(userData);
                }
            }
        );
    }

    function socialAuth(provider, isSignUp, spec, email) {

        if (!socialProviders[provider]) {
            throw Error('Unknown Social Provider');
        }

        self.loginPromise = $q.defer();

        if (config.isMobile) {

            var ref = window.open(
                config.apiUrl + '/1/'
                + getSocialUrl(provider, isSignUp)
                + '&appname=' + config.appName + (email ? ("&email=" + email) : '')
                + '&returnAddress=' + dummyReturnAddress,
                'id1',
                spec || 'left=1, top=1, width=600, height=600');

            mobileSocialLoginInner(ref, isSignUp, provider, spec);
        }
        else {
            self.socialAuthWindow = window.open(
                config.apiUrl + '/1/'
                + getSocialUrl(provider, isSignUp)
                + '&appname=' + config.appName + (email ? ("&email=" + email) : '')
                + '&returnAddress=',
                'id1',
                spec || 'left=1, top=1, width=600, height=600');

            window.addEventListener('message', (function (provider, spec) {
                return function (e) {
                    window.removeEventListener('message', arguments.callee);
                    setUserDataFromToken(e, provider, spec)
                }
            })(provider, spec), false);
        }
        return self.loginPromise.promise;
    }

    function setUserDataFromToken(event, provider, spec) {
        console.log(event, provider, spec);
        self.socialAuthWindow.close();
        self.socialAuthWindow = null;

        if (event.origin !== location.origin) {
            return;
        }

        var userData = JSON.parse(event.data);
        if (userData.error) {

            if (config.callSignupOnSingInSocialError && userData.error.message.indexOf(NOT_SIGNEDIN_ERROR) > -1) {  // check is right error
                socialAuth(provider, true, spec);
                return;
            }

            var rejection = {
                data: userData.error.message + ' (signing in with ' + userData.error.provider + ')'
            };
            rejection.error_description = rejection.data;
            self.loginPromise.reject(rejection);

        }
        else if (userData.data) {
            if (self.inSocialSignup) {
                self.inSocialSignup = false;
                $rootScope.$broadcast(EVENTS.SIGNUP);
            }
            return signinWithToken(userData.data);

        }
        else {
            self.loginPromise.reject();
        }
    }

    // tokens authentication
    function signinWithToken(userData) {
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


    function authenticate(authData) {
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
                angular.forEach(obj, function (value, key) {
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

                if (config.runSocket)
                    BackandSocketService.login(BKStorage.token.get(), config.anonymousToken, config.appName, config.socketUrl);


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

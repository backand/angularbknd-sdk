var http;

var config = {
    apiUrl: 'https://api.backand.com',
    socketUrl: 'https://socket.backand.com',
    anonymousToken: null,
    signUpToken: null,
    isManagingHttpInterceptor: true,
    isManagingRefreshToken: true,
    runSigninAfterSignup: true,
    callSignupOnSingInSocialError : true, // tell code to run signup after signIn error because user is not registered to application
    appName: null,
    userProfileName: 'backand_user',
    isMobile: false,
    runSocket: false
};

var EVENTS = {
    SIGNIN: 'BackandSignIn',
    SIGNOUT: 'BackandSignOut',
    SIGNUP: 'BackandSignUp'
};

var socialProviders = {
    github: {name: 'github', label: 'Github', url: 'www.github.com', css: 'github', id: 1},
    google: {name: 'google', label: 'Google', url: 'www.google.com', css: 'google-plus', id: 2},
    facebook: {name: 'facebook', label: 'Facebook', url: 'www.facebook.com', css: 'facebook', id: 3},
    twitter: {name: 'twitter', label: 'Twitter', url: 'www.twitter.com', css: 'twitter', id: 4}
};

function getSocialUrl(providerName, isSignup, isAutoSignUp) {
    var provider = socialProviders[providerName];
    var action = isSignup ? 'up' : 'in';
    var autoSignUpParam = '';
    if (!isSignup && isAutoSignUp) {
        autoSignUpParam = "&signupIfNotSignedIn=true";
    }
    return 'user/socialSign' + action +
        '?provider=' + provider.label + autoSignUpParam +
        '&response_type=token&client_id=self&redirect_uri=' + provider.url +
        '&state=';
}

BKStorage.register('token');
BKStorage.register('user');

// get token or error message from url in social sign-in popup
(function () {
    var dataRegex = /\?(data|error)=(.+)/;
    var dataMatch = dataRegex.exec(location.href);
    if (dataMatch && dataMatch[1] && dataMatch[2]) {
        var userData = {};
        userData[dataMatch[1]] = JSON.parse(decodeURI(dataMatch[2].replace(/#.*/, '')));
        window.opener.postMessage(JSON.stringify(userData), location.origin);
    }
}());

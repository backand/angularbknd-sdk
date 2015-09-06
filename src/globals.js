var http;

var config = {
    apiUrl: "https://api.backand.com",
    tokenName: 'backand_token',
    anonymousToken: null,
    signUpToken: null,
    isManagingDefaultHeaders: true,
    appName: null,
    userProfileName: 'backand_user'
};

var EVENTS = {
    SIGNIN: 'BackandSignIn',
    SIGNOUT: 'BackandSignOut',
    SIGNUP: 'BackandSignUp'
};

var socialProviders = {
    github: {name: 'github', label: 'Github', url: 'www.github.com', css: 'github', id: 1},
    google: {name: 'google', label: 'Google', url: 'www.google.com', css: 'google-plus', id: 2},
    facebook: {name: 'facebook', label: 'Facebook', url: 'www.facebook.com', css: 'facebook', id: 3}
};

function getSocialUrl(providerName, isSignup) {
    var provider = socialProviders[providerName];
    var action = isSignup ? 'up' : 'in';
    return 'user/socialSign' + action +
        '?provider=' + provider.label +
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

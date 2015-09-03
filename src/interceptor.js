angular.module('backand')
    .factory('BackandHttpInterceptor', ['$q', 'Backand', 'BackandHttpBufferService', 'BackandAuthService', HttpInterceptor])
    .config(['$httpProvider', function ($httpProvider) {
        $httpProvider.interceptors.push('BackandHttpInterceptor');
    }]);

function HttpInterceptor ($q, Backand, BackandHttpBufferService, BackandAuthService) {
    return {
        request: function(httpConfig) {
            // Exclusions
            if (!Backand.isManagingDefaultHeaders()) return httpConfig;
            if (!httpConfig.url.match(Backand.getApiUrl())) return httpConfig;
            if (httpConfig.url.match(Backand.getApiUrl() + '/token')) return httpConfig;

            var t = BKStorage.token.get();
            if (angular.isDefined(t)) {
                httpConfig.headers['Authorization'] = t;
            }
            if (config.anonymousToken) {
                httpConfig.headers['AnonymousToken'] = config.anonymousToken;
            }
            return httpConfig;
        },
        responseError: function (rejection) {
            if (rejection.config.url !== Backand.getApiUrl() + 'token') {
                if (rejection.status === 401) {

                    BackandAuthService.refreshToken(Backand.getUsername());
                    var deferred = $q.defer();
                    BackandHttpBufferService.append(rejection.config, deferred);
                    return deferred.promise;
                }
            }
            return $q.reject(rejection);
        }
    }
}

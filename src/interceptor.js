angular.module('backand')
    .factory('BackandHttpInterceptor', ['$q', '$rootScope', 'Backand', 'BackandHttpBufferService', 'BackandAuthService', HttpInterceptor])
    .config(['$httpProvider', function ($httpProvider) {
        $httpProvider.interceptors.push('BackandHttpInterceptor');
    }]);

function HttpInterceptor ($q, $rootScope, Backand, BackandHttpBufferService, BackandAuthService) {
    return {
        request: function(httpConfig) {
            // Exclusions
            if (config.isManagingHttpInterceptor
                && httpConfig.url.match(Backand.getApiUrl())
                && !httpConfig.url.match(Backand.getApiUrl() + '/token')) {

                var token = BKStorage.token.get();

                if (token) {
                    httpConfig.headers['Authorization'] = token;
                }

                if (config.anonymousToken) {
                    httpConfig.headers['AnonymousToken'] = config.anonymousToken;
                }
            }

            return httpConfig;
        },

        responseError: function (rejection) {

            if (config.isManagingHttpInterceptor
                && rejection.config.url !== Backand.getApiUrl() + 'token'
                && config.isManagingRefreshToken
                && rejection.status === 401
                && rejection.data
                && rejection.data.Message === 'invalid or expired token') {

                    BackandAuthService.refreshToken(Backand.getUsername())
                        .catch(onRefreshFailed);

                    var deferred = $q.defer();

                    BackandHttpBufferService.append(rejection.config, deferred);
                    return deferred.promise;
                }

            return $q.reject(rejection);
            
            function onRefreshFailed() {
                // If refresh has failed, we will not get a new token unless user manually logs in again.
                // There might be some code in the client application shows a login form in such case
                // So wee need to notify it
                $rootScope.$broadcast(EVENTS.TOKEN_EXPIRED);
            }
        }
    }
}

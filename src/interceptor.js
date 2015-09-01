(function () {
    angular.module('backand').factory('BackandHttpInterceptor', ['$q', 'Backand', 'BackandHttpBufferService', HttpInterceptor]);


    function HttpInterceptor ($q, Backand, BackandHttpBufferService) {
        return {
            responseError: function (rejection) {
                if (rejection.config.url !== Backand.getApiUrl() + 'token') {
                    if (rejection.status === 401) {

                        Backand.refreshToken();
                        var deferred = $q.defer();
                        BackandHttpBufferService.append(rejection.config, deferred);
                        return deferred.promise;
                    }
                }
                return $q.reject(rejection);
            }
        }
    }
})();

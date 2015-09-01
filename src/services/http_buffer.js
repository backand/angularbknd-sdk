(function () {
    angular.module('backand').service('BackandHttpBufferService', ['$injector', HttpBufferService]);

        function HttpBufferService($injector) {
        var self = this;
        var buffer = [];

        function retryHttpRequest(config, deferred) {
            function successCallback(response) {
                deferred.resolve(response);
            }
            function errorCallback(response) {
                deferred.reject(response);
            }
            var $http = $injector.get('$http');
            $http = $http || $injector.get('$http');
            $http(config).then(successCallback, errorCallback);
        }

        self.append = function (config, deferred) {
            buffer.push({
                config: config,
                deferred: deferred
            });
        };

        self.rejectAll = function (reason) {
            if (reason) {
                for (var i = 0; i < buffer.length; ++i) {
                    buffer[i].deferred.reject(reason);
                }
            }
            buffer = [];
        };

        function updater (config) {
            delete config.headers.Authorization;
            return config;
        }

        self.retryAll = function () {
            for (var i = 0; i < buffer.length; ++i) {
                retryHttpRequest(updater(buffer[i].config), buffer[i].deferred);
            }
            buffer = [];
        }

    }

})();

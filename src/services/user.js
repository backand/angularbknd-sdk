angular.module('backand').service('BackandUserService', ['$q', BackandUserService]);

function BackandUserService ($q) {
    var self = this;

    self.getUserDetails = function (force) {
        var deferred = $q.defer();
        if (force) {
            http({
                method: 'GET',
                url: config.apiUrl + '/api/account/profile'
            })
                .success(function (profile) {
                    BKStorage.user.set(angular.extend(BKStorage.user.get(), profile));
                    deferred.resolve(BKStorage.user.get());
                })
        } else {
            deferred.resolve(BKStorage.user.get());
        }
        return deferred.promise;
    };

    self.getUsername = function () {
        var userDetails;
        return (userDetails = BKStorage.user.get()) ? userDetails.username : null;
    };

    self.getUserRole = function () {
        var userDetails;
        return (userDetails = BKStorage.user.get()) ? userDetails.role : null;
    };

}

/**
 * Created by Itay on 11/17/15.
 */
angular.module('backand')
    .service('BackandSocketService', ['$rootScope', BackandSocketService]);

function BackandSocketService ($rootScope) {

  var self = this;

  self.socket = {on: function(){}}; //io.connect('http://localhost:4000');

  self.login = function(token, anonymousToken, appName, url){
    self.socket = io.connect(url, {'forceNew':true });

    self.socket.on('connect', function(){
      console.log('connected');
      self.socket.emit("login", token, anonymousToken, appName);
    });

    self.socket.on('disconnect', function() {
        console.log('disconnect');
    });

    self.socket.on('reconnecting', function() {
      console.log('reconnecting');
    });

  };

  self.on = function (eventName, callback) {
    self.socket.on(eventName, function () {
      var args = arguments;
      $rootScope.$apply(function () {
        callback.apply(self.socket, args);
      });
    });
  };

  self.emit = function (eventName, data, callback) {
    self.socket.emit(eventName, data, function () {
      var args = arguments;
      $rootScope.$apply(function () {
        if (callback) {
          callback.apply(self.socket, args);
        }
      });
    })
  }
}
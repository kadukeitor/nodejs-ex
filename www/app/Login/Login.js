'use strict';

angular
    .module('Login', [])
    .config(function ($stateProvider) {
        $stateProvider
            .state('login', {
                url: '/login',
                templateUrl: 'app/Login/Login.html',
                controller: 'LoginCtrl',
                resolve: {
                    skipIfLoggedIn: skipIfLoggedIn
                }
            })
    })
    .controller('LoginCtrl', LoginCtrl);


function LoginCtrl($scope, $auth, $state, ProfileSvc) {
    $scope.authenticate = function () {
        $auth.authenticate('facebook')
            .then(function () {
                $state.go('app.home');
            })
            .catch(function (error) {
                console.log(error);
            });
    };
}

var skipIfLoggedIn = function ($q, $auth) {
    var deferred = $q.defer();
    if ($auth.isAuthenticated()) {
        deferred.reject();
    } else {
        deferred.resolve();
    }
    return deferred.promise;
};
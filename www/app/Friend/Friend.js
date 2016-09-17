'use strict';

angular
    .module('Friend', [])
    .config(function ($stateProvider) {
        $stateProvider
            .state('friend', {
                url: '/friend',
                cache: false,
                params: {
                    friend: null
                },
                resolve: {
                    loginRequired: loginRequired
                },
                templateUrl: 'app/Friend/Friend.html',
                controller: 'FriendCtrl'
            })
    })
    .controller('FriendCtrl', FriendCtrl)
;


function FriendCtrl($scope, $state, $mdDialog, ActivitiesSvc) {

    if (!$state.params.friend) {
        return $state.go('app.profile');
    }

    $scope.activities = [];
    $scope.friend = $state.params.friend;

    ActivitiesSvc.friend($scope.friend)
        .then(function (activities) {
            $scope.activities = activities;
        });

    $scope.back = function () {
        $state.go('app.profile');
    }

}

var loginRequired = function ($q, $location, $auth, ProfileSvc) {
    var deferred = $q.defer();
    if ($auth.isAuthenticated()) {
        ProfileSvc.getProfile()
            .then(function () {
                deferred.resolve();
            });
    } else {
        $location.path('/login');
    }
    return deferred.promise;
};

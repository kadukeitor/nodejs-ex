'use strict';

angular
    .module('Profile', [])
    .config(function ($stateProvider) {
        $stateProvider
            .state('app.profile', {
                url: '/profile',
                templateUrl: 'app/Profile/Profile.html',
                controller: 'ProfileCtrl'
            })
    })
    .controller('ProfileCtrl', ProfileCtrl)
    .factory('ProfileSvc', ProfileSvc);


function ProfileCtrl($scope, $state, $auth, ProfileSvc, ActivitiesSvc) {

    $scope.stats = {};
    $scope.friends = [];

    ActivitiesSvc.stats()
        .then(function (result) {
            $scope.stats = result;
        });

    ProfileSvc.getFriends()
        .then(function (friends) {
            $scope.friends = friends || [];
        });

    $scope.logout = function () {
        $auth.logout()
            .then(function () {
                $state.go('login');
            });
    };

    $scope.friendActivities = function (friend) {
        $state.go('friend', {friend: friend});
    }

}

function ProfileSvc($q, $rootScope, $http) {

    var profile;

    function get() {
        return profile;
    }

    function getProfile() {
        var deferred = $q.defer();
        $http.get('/api/me')
            .then(function (response) {
                profile = response.data;
                deferred.resolve(profile);
            });
        return deferred.promise;
    }

    function getFriends() {
        var deferred = $q.defer();
        $http.get('/api/friends')
            .then(function (response) {
                deferred.resolve(response.data);
            });
        return deferred.promise;
    }

    return {
        get: get,
        getProfile: getProfile,
        getFriends: getFriends
    }
}
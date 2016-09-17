'use strict';

angular
    .module('Activities', [])
    .config(function ($stateProvider) {
        $stateProvider
            .state('app.activities', {
                url: '/activities',
                templateUrl: 'app/Activities/Activities.html',
                controller: 'ActivitiesCtrl'
            })
    })
    .controller('ActivitiesCtrl', ActivitiesCtrl)
    .factory('ActivitiesSvc', ActivitiesSvc)
;


function ActivitiesCtrl($scope, $state, $mdDialog, ActivitiesSvc) {

    $scope.activities = [];

    ActivitiesSvc.me()
        .then(function (activities) {
            $scope.activities = activities;
        });

    $scope.exitActivity = function (ev, activity) {
        var confirm = $mdDialog.confirm()
            .title('Exit this Activity?')
            .textContent('Do you want to exit of this Activity?')
            .ariaLabel('Exit this Activity?')
            .targetEvent(ev)
            .ok('Yes')
            .cancel('No');
        $mdDialog.show(confirm)
            .then(function () {
                ActivitiesSvc.unsubscribe(activity)
                    .then(function () {
                        $scope.activities.splice($scope.activities.indexOf(activity), 1);
                    })
            });
    };

    $scope.newActivity = function () {
        $state.go('app.activity');
    };

    $scope.$on('activity:update', function (event, activity) {
        $scope.activities[ActivitiesSvc.getActivityIndex(activity, $scope.activities)] = activity;
    })

}

function ActivitiesSvc($q, $http, $socket, $rootScope) {


    $socket.socket().on('activity:update', function (activity) {
        $rootScope.$broadcast('activity:update', activity);
    });

    $socket.socket().on('activity:create', function (activity) {
        $rootScope.$broadcast('activity:create', activity);
    });


    function wall() {
        var deferred = $q.defer();
        $http.get('/api/activities/wall')
            .then(function (response) {
                deferred.resolve(response.data);
            });
        return deferred.promise;
    }

    function me() {
        var deferred = $q.defer();
        $http.get('/api/activities/me')
            .then(function (response) {
                deferred.resolve(response.data);
            });
        return deferred.promise;
    }

    function friend(user) {
        var deferred = $q.defer();
        $http.get('/api/activities/' + user._id)
            .then(function (response) {
                deferred.resolve(response.data);
            });
        return deferred.promise;
    }

    function stats() {
        var deferred = $q.defer();
        $http.get('/api/activities/me/stats')
            .then(function (response) {
                deferred.resolve(response.data);
            });
        return deferred.promise;
    }

    function subscribe(activity) {
        var deferred = $q.defer();
        $http.get('/api/activity/' + activity._id + '/subscribe')
            .then(function (response) {
                deferred.resolve(response.data);
            });
        return deferred.promise;
    }

    function unsubscribe(activity) {
        var deferred = $q.defer();
        $http.get('/api/activity/' + activity._id + '/unsubscribe')
            .then(function (response) {
                deferred.resolve(response.data);
            });
        return deferred.promise;
    }

    function getActivityIndex(activity, activities_source) {
        var result = -1;
        activities_source.forEach(function (item, index) {
            if (activity._id == item._id) {
                result = index;
            }
        });
        return result;
    }

    return {
        wall: wall,
        me: me,
        friend: friend,
        stats: stats,
        subscribe: subscribe,
        unsubscribe: unsubscribe,
        getActivityIndex: getActivityIndex
    }

}
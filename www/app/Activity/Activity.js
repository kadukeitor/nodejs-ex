'use strict';

angular
    .module('Activity', [])
    .config(function ($stateProvider) {
        $stateProvider
            .state('app.activity', {
                url: '/activity',
                templateUrl: 'app/Activity/Activity.html',
                controller: 'ActivityCtrl'
            })
    })
    .controller('ActivityCtrl', ActivityCtrl)
    .factory('ActivitySvc', ActivitySvc)
;


function ActivityCtrl($scope, $state, $mdToast, ActivitySvc) {

    $scope.minDate = new Date();

    $scope.activity = {
        datetime: new Date()
    };

    $scope.save = function (activity) {
        if (activity._id) {
            ActivitySvc.update(activity)
                .then(function (response) {
                    $state.go('app.home');
                    $mdToast.show(
                        $mdToast.simple()
                            .textContent('Activity Updated')
                            .hideDelay(3000)
                    );
                });
        } else {
            ActivitySvc.create(activity)
                .then(function (response) {
                    $state.go('app.home');
                    $mdToast.show(
                        $mdToast.simple()
                            .textContent('Activity Saved')
                            .hideDelay(3000)
                    );
                });
        }
    };

}

function ActivitySvc($q, $http) {

    function create(activity) {
        var deferred = $q.defer();
        $http.post('/api/activity', activity)
            .then(function (response) {
                deferred.resolve(response.data);
            });
        return deferred.promise;
    }

    function update(activity) {
        var deferred = $q.defer();
        $http.put('/api/activity/' + activity._id, activity)
            .then(function (response) {
                deferred.resolve(response.data);
            });
        return deferred.promise;
    }

    return {
        create: create,
        update: update
    }

}
'use strict';

angular
    .module('Admin', [])
    .config(function ($stateProvider) {
        $stateProvider
            .state('app.admin', {
                url: '/admin',
                templateUrl: 'app/Admin/Admin.html',
                controller: 'AdminCtrl'
            })
    })
    .controller('AdminCtrl', AdminCtrl)
    .factory('AdminSvc', AdminSvc)
;

function AdminCtrl($scope, $state, $mdToast, $mdDialog, AdminSvc) {

    $scope.bots = [];
    $scope.users = [];
    $scope.activities = [];

    AdminSvc.bots()
        .then(function (bots) {
            $scope.bots = bots;
        });

    AdminSvc.users()
        .then(function (users) {
            $scope.users = users;
        });

    AdminSvc.activities()
        .then(function (activities) {
            $scope.activities = activities;
        });

    $scope.minDate = new Date();
    $scope.activity = {
        activity: 'notification',
        datetime: new Date(),
        duration: 0,
        location: 'Social Fitness'
    };

    $scope.save = function (activity) {
        AdminSvc.createUserActivity(activity.user, activity)
            .then(function (response) {
                $mdToast.show(
                    $mdToast.simple()
                        .textContent('Activity Saved')
                        .hideDelay(3000)
                );
                $state.go('app.home');
            });
    };

    $scope.delete = function (ev, activity) {
        var confirm = $mdDialog.confirm()
            .title('Delete  Activity?')
            .textContent('Do you want to delete of this Activity?')
            .ariaLabel('Delete  Activity?')
            .targetEvent(ev)
            .ok('Yes')
            .cancel('No');
        $mdDialog.show(confirm)
            .then(function () {
                AdminSvc.deleteActivity(activity)
                    .then(function (response) {
                        if (response) {
                            $scope.activities.splice($scope.activities.indexOf(activity), 1);
                            $mdToast.show(
                                $mdToast.simple()
                                    .textContent('Activity Removed')
                                    .hideDelay(3000)
                            );
                        }
                    });
            });
    }

}

function AdminSvc($q, $http) {

    function users() {
        var deferred = $q.defer();
        $http.get('/api/admin/users')
            .then(function (response) {
                deferred.resolve(response.data);
            });
        return deferred.promise;
    }

    function bots() {
        var deferred = $q.defer();
        $http.get('/api/bots')
            .then(function (response) {
                deferred.resolve(response.data);
            });
        return deferred.promise;
    }

    function activities() {
        var deferred = $q.defer();
        $http.get('/api/activities')
            .then(function (response) {
                deferred.resolve(response.data);
            });
        return deferred.promise;
    }

    function createUserActivity(user, activity) {
        var deferred = $q.defer();
        $http.post('/api/activity/' + user, activity)
            .then(function (response) {
                deferred.resolve(response.data);
            });
        return deferred.promise;
    }

    function deleteActivity(activity) {
        var deferred = $q.defer();
        $http.delete('/api/activity/' + activity._id)
            .then(function (response) {
                deferred.resolve(response.data);
            });
        return deferred.promise;
    }

    return {
        users: users,
        bots: bots,
        activities: activities,
        createUserActivity: createUserActivity,
        deleteActivity: deleteActivity
    }

}
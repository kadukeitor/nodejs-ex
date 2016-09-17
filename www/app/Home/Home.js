'use strict';

angular
    .module('Home', [])
    .config(function ($stateProvider) {
        $stateProvider
            .state('app.home', {
                url: '/home',
                templateUrl: 'app/Home/Home.html',
                controller: 'HomeCtrl'
            })
    })
    .controller('HomeCtrl', HomeCtrl);


function HomeCtrl($scope, $state, $rootScope, $mdDialog, $mdToast, ActivitiesSvc) {

    $scope.activities = [];

    ActivitiesSvc.wall()
        .then(function (activities) {
            $scope.activities = activities;
        });

    $scope.newActivity = function () {
        $state.go('app.activity');
    };

    $scope.joinToActivity = function (ev, activity) {
        var confirm = $mdDialog.confirm()
            .title('Join this Activity ?')
            .textContent('Do you want to join this Activity ?')
            .ariaLabel('Join this Activity ?')
            .targetEvent(ev)
            .ok('Yes')
            .cancel('No');
        $mdDialog.show(confirm)
            .then(function () {
                ActivitiesSvc.subscribe(activity)
                    .then(function (response) {
                        $scope.activities[$scope.activities.indexOf(activity)] = response;
                        $mdToast.show(
                            $mdToast.simple()
                                .textContent('Congratulation, you are subscribed to this Activity.')
                                .hideDelay(3000)
                        );
                    })
            });
    };

    $scope.getColor = function (activity) {
        return randomColor({
            luminosity: 'light',
            seed: activity._id
        });
    };

    $scope.isSubscribed = function (activity) {
        var subscribed = false;
        activity.members.forEach(function (member) {
            if (member._id == $scope.user._id) {
                subscribed = true;
                return true;
            }
        });
        return subscribed;
    };

    $scope.$on('activity:create', function (event, activity) {
        if (ActivitiesSvc.getActivityIndex(activity, $scope.activities) == -1) {
            $scope.activities.unshift(activity);
        }
    });

    $scope.$on('activity:update', function (event, activity) {
        $scope.activities[ActivitiesSvc.getActivityIndex(activity, $scope.activities)] = activity;
    })

}
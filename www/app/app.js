'use strict';

angular
    .module('sofitn', [
        'ngAria',
        'ngMessages',
        'ngSanitize',
        'ngMaterial',
        'ui.router',
        'satellizer',
        'ngMap',
        'ngMaterialDatePicker',
        'angularMoment',
        'Login',
        'Home',
        'Activities',
        'Activity',
        'Members',
        'Profile',
        'Friend',
        'Admin'
    ])
    .config(function ($urlRouterProvider, $stateProvider, $httpProvider, $authProvider) {
        // Http
        $httpProvider.interceptors.push('authInterceptor');
        // Authentication
        $authProvider.tokenPrefix = 'sofitn';
        $authProvider.facebook({
            clientId: '876896985743811',
            scope: ['public_profile', 'user_friends', 'email']
        });
        // Routes
        $stateProvider
            .state('app', {
                abstract: true,
                url: '/app',
                controller: 'AppCtrl',
                templateUrl: 'app/app.html',
                resolve: {
                    loginRequired: loginRequired
                }
            });
        //Default Route
        $urlRouterProvider.otherwise('/app/home');

    })
    .controller('AppCtrl', AppCtrl)
    .factory('$socket', SocketSvc)
    .service('authInterceptor', function ($q, $location) {
        var service = this;
        service.responseError = function (response) {
            if (response.status == 400 || response.status == 409) {
                localStorage.removeItem('sofitn_token');
                $location.path('/login');
            }
            return $q.reject(response);
        };
    })
    .filter('capitalize', function () {
        return function (input) {
            return (!!input) ? input.charAt(0).toUpperCase() + input.substr(1).toLowerCase() : '';
        }
    });

function AppCtrl($scope, $state, $socket, $mdDialog, $mdSidenav, ProfileSvc) {

    // Socket
    $socket.connect();

    // Sidebar
    $scope.toggleLeft = buildToggler('left');
    $scope.toggleRight = buildToggler('right');
    // Sidebar Helper
    function buildToggler(componentId) {
        return function () {
            $mdSidenav(componentId).toggle();
        }
    }

    // Navigation
    $scope.goTo = function (state) {
        $scope.toggleLeft();
        $state.go(state);
    };

    // Open Members
    $scope.openMembers = function (ev, activity) {
        $mdDialog
            .show({
                templateUrl: 'app/Members/Members.html',
                parent: angular.element(document.body),
                targetEvent: ev,
                fullscreen: true,
                controller: function ($scope, $mdDialog) {

                    $scope.activity = activity;

                    $scope.hide = function () {
                        $mdDialog.hide();
                    };
                    $scope.cancel = function () {
                        $mdDialog.cancel();
                    };
                    $scope.answer = function (answer) {
                        $mdDialog.hide(answer);
                    };
                }
            })
            .then(function (answer) {
                $scope.status = 'You said the information was "' + answer + '".';
            }, function () {
                $scope.status = 'You cancelled the dialog.';
            });
    };

    // Profile
    $scope.user = ProfileSvc.get();

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


function SocketSvc($auth) {

    var socket;

    return {

        connect: function () {
            socket = io.connect('/', {'forceNew': true, query: "token=" + $auth.getToken()});
        },

        socket: function () {
            return socket;
        },

        disconnect: function () {
            if (socket) {
                socket.disconnect();
            }
        }

    }

}
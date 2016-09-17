'use strict';

angular
    .module('Members', [])
    .config(function ($stateProvider) {
        $stateProvider
            .state('members', {
                url: '/members',
                templateUrl: 'app/Members/Members.html',
                controller: 'MembersCtrl'
            })
    })
    .controller('MembersCtrl', MembersCtrl);


function MembersCtrl($scope, $timeout, $state) {
    
}
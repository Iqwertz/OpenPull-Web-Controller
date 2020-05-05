var app = angular.module('app', []);
app.controller('Controls', function($scope) {
    $scope.MoveDistance = 10;
    $scope.ControllerInterface = true;
    
    
    $scope.MoveUp = function(){
        send("G0 "+$scope.MoveDistance);
    }
    $scope.MoveDown = function(){
        send("G0 "+$scope.MoveDistance*-1);
    }
});
/////angular controller for the maschine manual controlls"

var app = angular.module('app', []);

app.controller('Controls', function($scope) {
    $scope.MoveDistance = Config.DefaultMoveDistance; //Set Defaultmovedistance
    $scope.ControllerInterface = true;  //Show the Controller Interface (Or the add Test data Interface, when false)
    $scope.BleStatus = false;  //Var holding the Ble connection Status
    $scope.MoveEnable = false;      //Var to detect if the Move buttons should be enabled
    
    $scope.MoveUp = function(){  //Called when up button is pressed //Sends G0 and the set distance
        send("G0 "+$scope.MoveDistance);
    }
    $scope.MoveDown = function(){  //Called when down button is pressed //Sends G0 and the negative set distance
        send("G0 "+$scope.MoveDistance*-1);
    }
    
    $scope.Stop = function(){ //When Stop is Called send "S " to stop the current move of the maschine
        send("S ");
    }
});
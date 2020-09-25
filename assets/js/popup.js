app.controller('Popup', function($scope) {   //Start new popup COntroller
    $scope.maximum = 0;
    $scope.breakpoint = 0;
    $scope.showPopup = false;

}); 

function SetPopupData(parameter, data){  //Set the Send Status to the angular controller var
    var scope = angular.element(document.getElementById("popup")).scope();
    scope.$apply(function(){
        scope[parameter] = data;
    })
} 
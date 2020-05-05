app.controller('AddTest', function($scope) {
    $scope.Name="";
    
    $scope.parameter = [{Name: "Infill", Value: 15, Unit: "%"},{Name: "Layer Height", Value: 0.5, Unit: "mm"},{Name: "Nozzle Temperatur", Value: 200, Unit: "°"}];
    
    $scope.TestModes = ["Slow Test (M10)", "Fast Test (M13)"];
    $scope.SelectedMode;
    
    $scope.Notes="";

    $scope.NewParameterField="";
    $scope.AddParameter = function() {
        if($scope.NewParameterField!=""){
            $scope.parameter.push({Name: $scope.NewParameterField, Value: 0, Unit: ""});
            $scope.NewParameterField="";
        }
    }

    $scope.RemoveParameter = function(index) {	
        $scope.parameter.splice(index, 1);
    }
    
    $scope.StartTest = function(){
        if($scope.Name!="" && $scope.SelectedMode!=null){
            var Mode;
            if($scope.SelectedMode==$scope.TestModes[0]){
                Mode="M10";
            } else if ($scope.SelectedMode==$scope.TestModes[1]){
                Mode="M13";
            }
            BleStartNewTest($scope.Name, $scope.parameter, Mode, $scope.Notes);
        }else{
            alert("Please Select Test Mode and set Name")
        }
    }
});  


function BleStartNewTest(Name, Parameter, TestMode, Notes){
    
}